import re

def classify_product_name(text_data):
    # Extract the first identifiable product name line
    for line in text_data:
        if "giloy" in line.lower():  # Adjusted for case-insensitive match
            return line.strip()
    return "N/A"

def classify_dates(text_data):
    mfg_date, exp_date = "N/A", "N/A"
    
    for line in text_data:
        # Look for manufacturing and expiration dates in "MMM-YYYY" or "MM-YYYY" formats
        mfg_match = re.search(r"\b(Mfg|Manufacture|Mfd|Prep).*?(\b\w{3}-\d{4}\b|\d{2}-\d{4})", line, re.IGNORECASE)
        exp_match = re.search(r"\b(Exp|Expiry|Exp\.).*?(\b\w{3}-\d{4}\b|\d{2}-\d{4})", line, re.IGNORECASE)
        
        if mfg_match:
            mfg_date = mfg_match.group(2)  # Get the date part of the match
        if exp_match:
            exp_date = exp_match.group(2)
    
    return mfg_date, exp_date

def classify_product_type(text_data):
    # Return "N/A" since no specific product type is discernable
    return "N/A"

# Path to the OCR text file
ocr = "D:/FlipKart GRiD 6.0 Robotic Track/prototype/project/ocr/ocr.txt"

# Read the file
with open(ocr, 'r') as file:
    text_data = file.readlines()

# Classifications
product_name = classify_product_name(text_data)
mfg_date, exp_date = classify_dates(text_data)
product_type = classify_product_type(text_data)

# Store results in text file
with open("product_classifier.txt", "w") as output_file:
    output_file.write("Classified Information:\n")
    output_file.write(f"Product Name: {product_name}\n")
    output_file.write(f"Manufacturing Date: {mfg_date}\n")
    output_file.write(f"Expiration Date: {exp_date}\n")
    output_file.write(f"Product Type: {product_type}\n")

print("Classified information saved to product_classifier.txt.")
