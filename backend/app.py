import os
import openai
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Explicitly load .env from the directory containing this script
script_dir = os.path.dirname(__file__)
dotenv_path = os.path.join(script_dir, '.env')
if os.path.exists(dotenv_path):
    print(f"Loading .env file from: {dotenv_path}")
    load_dotenv(dotenv_path=dotenv_path)
else:
    print(f"Warning: .env file not found at {dotenv_path}")

# --- OpenAI Client Setup ---
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("Warning: OPENAI_API_KEY environment variable not set.")
    # You might want to raise an error or handle this case differently
    # depending on whether the API is essential for the app to run.
    client = None
else:
    try:
        client = openai.OpenAI(api_key=api_key)
    except Exception as e:
        print(f"Error initializing OpenAI client: {e}")
        client = None

# Initialize Flask app
app = Flask(__name__)

# Setup CORS
CORS(app, resources={r"/api/*": {"origins": "*"}}) # Adjust origins for production

# Helper function to format transcript
def format_transcript(transcript_entries):
    formatted = ""
    for entry in transcript_entries:
        speaker = entry.get('speaker', 'Unknown').upper()
        text = entry.get('text', '')
        timestamp = entry.get('timestamp', '')
        formatted += f"[{timestamp}] {speaker}: {text}\n"
    return formatted.strip()

@app.route('/')
def home():
    return "Flask backend is running!"

# Endpoint for real-time analysis/suggestions
@app.route('/api/analyze', methods=['POST'])
def analyze_interview():
    if not client:
        return jsonify({"error": "OpenAI client not initialized. Check API key."}), 500

    data = request.json
    interview_context = data.get('context', '')
    transcript_data = data.get('transcript', [])

    if not transcript_data:
        return jsonify({"message": "No transcript data provided for analysis.", "analysis": ""})

    formatted_transcript = format_transcript(transcript_data)

    prompt = f"""
    Analyze the following user interview excerpt. The interview's initial context was:
    --- START CONTEXT ---
    {interview_context}
    --- END CONTEXT ---

    Here is the transcript so far:
    --- START TRANSCRIPT ---
    {formatted_transcript}
    --- END TRANSCRIPT ---

    Based *only* on the provided context and transcript, suggest EITHER 1-2 insightful follow-up questions the interviewer could ask OR mention 1-2 key themes emerging. Focus on the most recent parts of the conversation if relevant.

    Format the output *exactly* like this, using standard markdown list syntax:
    Place the first list item immediately on the line below the bold header, with no blank line in between.

    **Follow up questions**
    * [Question 1]
    * [Question 2 (if applicable)]

    **Key themes**
    * [Theme 1]
    * [Theme 2 (if applicable)]
    
    Ensure there is a blank line between the end of one list and the start of the next header. Only include the sections (questions or themes) that you generate.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini", # Cost-effective and capable model
            messages=[
                {"role": "system", "content": "You are an expert UX research assistant helping an interviewer."}, 
                {"role": "user", "content": prompt}
            ],
            temperature=0.5, # Lower temperature for more focused suggestions
            max_tokens=150
        )
        analysis_result = response.choices[0].message.content.strip()
        return jsonify({"message": "Analysis complete.", "analysis": analysis_result})

    except Exception as e:
        print(f"Error calling OpenAI API for analysis: {e}")
        return jsonify({"error": f"Failed to get analysis from OpenAI: {e}"}), 500

# Endpoint for generating summary
@app.route('/api/summarize', methods=['POST'])
def summarize_interview():
    if not client:
        return jsonify({"error": "OpenAI client not initialized. Check API key."}), 500
        
    data = request.json
    interview_context = data.get('context', '')
    transcript_data = data.get('transcript', [])

    if not transcript_data:
         return jsonify({"error": "No transcript data provided for summarization."}), 400

    formatted_transcript = format_transcript(transcript_data)

    prompt = f"""
    Generate a concise bullet-point summary of the key highlights, insights, and main themes from the following user interview transcript. Consider the initial interview context provided.

    Initial Context:
    --- START CONTEXT ---
    {interview_context}
    --- END CONTEXT ---

    Transcript:
    --- START TRANSCRIPT ---
    {formatted_transcript}
    --- END TRANSCRIPT ---

    Format the summary *exactly* as follows for each key point:
    1. Output the theme or highlight title formatted as **bold** using markdown.
    2. Immediately after the bold title, output a newline character.
    3. On the very next line, start the descriptive text for that point.
    4. After the description for one point, ensure there is exactly one blank line (a double newline) before the bold title of the next point.
    5. Do NOT use bullet point characters like '•' or '-'.
    Example:
    **Theme Title 1**
    Description for theme 1.
    
    **Theme Title 2**
    Description for theme 2.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini", 
            messages=[
                {"role": "system", "content": "You are an expert summarizer specializing in user interviews."}, 
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500 # Allow more tokens for summary
        )
        summary_result = response.choices[0].message.content.strip()
        
        # --- DEBUG: Print raw AI output --- 
        print("--- Raw OpenAI Summary Output ---")
        print(summary_result)
        print("---------------------------------")
        # --- END DEBUG --- 
        
        return jsonify({"message": "Summary generated successfully.", "summary": summary_result})

    except Exception as e:
        print(f"Error calling OpenAI API for summary: {e}")
        return jsonify({"error": f"Failed to get summary from OpenAI: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001) 