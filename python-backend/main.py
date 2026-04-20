from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import torch.nn as nn
from PIL import Image
import io
import base64
import torchvision.transforms as transforms
import timm
import os

app = FastAPI(title="DermoAI ML Backend")

# Enable CORS for the Next.js app to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, set this to your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model Definition
class MultiLayerHybridModel(nn.Module):
    def __init__(self, num_classes=2):
        super().__init__()
        self.local = timm.create_model('tf_efficientnet_b4_ns', pretrained=False, features_only=True)
        self.globalm = timm.create_model('coatnet_0_rw_224.sw_in1k', pretrained=False, features_only=True)
        self.fuse1 = nn.Linear(128, 128)
        self.fuse2 = nn.Linear(248, 256)
        self.fuse3 = nn.Linear(544, 512)
        self.classifier = nn.Sequential(
            nn.Linear(896, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, num_classes)
        )
        
    def forward(self, x):
        loc_feats = self.local(x)
        glo_feats = self.globalm(x)
        loc = [torch.nn.functional.adaptive_avg_pool2d(f, 1).flatten(1) for f in loc_feats]
        glo = [torch.nn.functional.adaptive_avg_pool2d(f, 1).flatten(1) for f in glo_feats]
        f1 = self.fuse1(torch.cat([loc[1], glo[1]], dim=1))
        f2 = self.fuse2(torch.cat([loc[2], glo[2]], dim=1))
        f3 = self.fuse3(torch.cat([loc[3], glo[3]], dim=1))
        combined = torch.cat([f1, f2, f3], dim=1)
        return self.classifier(combined)

device = torch.device("cpu")
skin_classes = ['Benign', 'Malignant']

# Initialize globally
try:
    skin_model = MultiLayerHybridModel(num_classes=2)
    skin_path = 'multi layer.pth' # Must be placed in python-backend root
    if os.path.exists(skin_path):
        checkpoint = torch.load(skin_path, map_location=device, weights_only=False)
        state_dict = checkpoint.get('state_dict', checkpoint)
        new_state_dict = {k[7:] if k.startswith('module.') else k: v for k, v in state_dict.items()}
        skin_model.load_state_dict(new_state_dict, strict=False)
        
        # --- AGGRESSIVE MEMORY CLEARING FOR RENDER FREE TIER (512MB MAX) ---
        del checkpoint
        del state_dict
        del new_state_dict
        import gc
        gc.collect()
        # -------------------------------------------------------------------
        
        print("Model loaded successfully!")
    else:
        print(f"Warning: Model file {skin_path} not found.")
    skin_model.eval()
except Exception as e:
    print(f"Failed to load model: {e}")

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

class ImageRequest(BaseModel):
    image: str # Base64 string

@app.post("/classify")
async def classify_image(request: ImageRequest):
    try:
        # Decode Base64 string
        image_data = base64.b64decode(request.image)
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        tensor = transform(image).unsqueeze(0).to(device)

        with torch.no_grad():
            skin_out = skin_model(tensor)
            skin_probs = torch.softmax(skin_out, dim=1)
            skin_conf_tensor, skin_idx = torch.max(skin_probs, 1)
            skin_conf = skin_conf_tensor.item()
            skin_label = skin_classes[skin_idx.item()]

        return {
            "classification": skin_label.lower(),
            "condition_name": skin_label,
            "confidence": float(skin_conf),
            "severity": "High" if skin_label == 'Malignant' else "Low"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def health_check():
    return {"status": "healthy", "model": "DermoAI"}
