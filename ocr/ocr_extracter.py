import pytesseract
from PIL import Image

def extract_text(image_path):
    #  OCR operation
    image = Image.open(image_path)
    text = pytesseract.image_to_string(image)
    return text

path="Test2.jpg"
a=extract_text(path)

with open("ocr.txt",'w') as ocr_file:
    ocr_file.write(a)
print("file saved")