import urllib.request
import json

api_key = "your_openrouter_api_key_here"

mock_users = [
  {"id": "ADMIN_ID", "name": "Admin", "role": "ADMIN"},
  {"id": "PM01", "name": "Ayesha Khan", "role": "MANAGER"},
  {"id": "PM02", "name": "Bilal Ahmed", "role": "MANAGER"},
  {"id": "PM03", "name": "Hina Malik", "role": "MANAGER"},
  {"id": "DEV01", "name": "Ali Raza", "role": "AGENT"},
  {"id": "DEV02", "name": "Hamza Shah", "role": "AGENT"},
  {"id": "DEV03", "name": "Sara Noor", "role": "AGENT"}
]

transcript = """
Ayesha: First project is UrbanCart Website, for client UrbanCart Clothing. I'll manage it. They need a responsive website where customers can browse products, view product details, and add items to a demo cart. We initially discussed 18 October as the delivery date.
Ali: Do they need a real checkout, payment gateway, and stock integration?
Ayesha: No. For this phase the cart is a demo.
Ali: I can own the product catalog interface: product listing, a product detail screen, and responsive layout. Put that down as 12 estimated hours, due on 12 October.
Ayesha: Please call that task Product catalog UI. We also need the demo cart interface as a separate task so we can track it separately.
Ali: Yes. Demo cart UI will take 8 hours, due 15 October.
Hamza: For Product and cart APIs, I estimate 14 hours. I own it, and the deadline is 14 October.
Ayesha: Accepted. Website integration and testing is 6 hours, due 19 October. The final UrbanCart project deadline is 20 October.
"""

system_prompt = f"""You are an AI Project Manager Assistant. Extract projects and tasks from the transcript.
Team directory: {json.dumps(mock_users)}

Instructions:
1. Extract projects (name, clientName, description, managerId, deadline).
2. Extract tasks (title, description, assigneeId, deadline, estimatedHours).
3. Match managerId and assigneeId to the exact 'id' from the team directory based on names.
4. Dates should be YYYY-MM-DD (Year is 2026).
"""

data = {
    "model": "openai/gpt-4o-mini",
    "messages": [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Parse this and return JSON:\n\n{transcript}"}
    ],
    "response_format": { "type": "json_object" },
    "temperature": 0
}

req = urllib.request.Request(
    "https://openrouter.ai/api/v1/chat/completions",
    data=json.dumps(data).encode('utf-8'),
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
)

print("Calling OpenRouter API to test transcript extraction...")
try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
        print("\n--- AI Extraction Successful ---")
        print(result['choices'][0]['message']['content'])
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
