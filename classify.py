import sys
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
import io
import base64
import json
import torchvision.transforms as transforms
from torchvision.models import efficientnet_b0
import timm
import os

# ==========================================
# SKIN LESION MODEL ARCHITECTURE (Benign/Malignant)
# ==========================================
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

# ==========================================
# 3. PREDICTION LOGIC (Benign/Malignant Only)
# ==========================================
def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        return

    img_path = sys.argv[1]

    try:
        device = torch.device("cpu") # Use CPU for inference bridge

        # --- Load Skin Lesion Model ---
        skin_classes = ['Benign', 'Malignant']
        skin_path = 'multi layer.pth'
        skin_model = MultiLayerHybridModel(num_classes=2)
        if os.path.exists(skin_path):
            checkpoint = torch.load(skin_path, map_location=device, weights_only=False)
            state_dict = checkpoint.get('state_dict', checkpoint)
            new_state_dict = {k[7:] if k.startswith('module.') else k: v for k, v in state_dict.items()}
            skin_model.load_state_dict(new_state_dict, strict=False)
        skin_model.eval()

        # --- Preprocess ---
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

        image = Image.open(img_path).convert("RGB")
        tensor = transform(image).unsqueeze(0).to(device)

        # --- Inference: Skin Lesion Classification ---
        with torch.no_grad():
            skin_out = skin_model(tensor)
            skin_probs = torch.softmax(skin_out, dim=1)
            skin_conf_tensor, skin_idx = torch.max(skin_probs, 1)
            skin_conf = skin_conf_tensor.item()
            skin_label = skin_classes[skin_idx.item()]

        # --- Result ---
        result = {
            "classification": skin_label.lower(),
            "condition_name": skin_label,
            "confidence": float(skin_conf),
            "severity": "High" if skin_label == 'Malignant' else "Low"
        }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
