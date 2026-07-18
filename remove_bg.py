import os
from rembg import remove
from PIL import Image

def remove_background(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        input_image = Image.open(input_path)
        output_image = remove(input_image)
        output_image.save(output_path, format="WEBP")
        print(f"Saved to {output_path}")
    except Exception as e:
        print(f"Failed {input_path}: {e}")

directory = "frontend/public/boxes"
for filename in os.listdir(directory):
    if filename.endswith(".jpg"):
        input_path = os.path.join(directory, filename)
        output_path = os.path.join(directory, filename.replace(".jpg", ".webp"))
        remove_background(input_path, output_path)

print("Done!")
