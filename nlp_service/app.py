from flask import Flask, request, jsonify
from model import BarranquillaNLPModel  # Assuming model.py is in the same directory
import os

app = Flask(__name__)
nlp_model = BarranquillaNLPModel()

# Define the directory for data files within the nlp_service directory
DATA_DIR = os.path.dirname(os.path.abspath(__file__))
MOOD_CLASSIFIER_PATH = os.path.join(DATA_DIR, "mood_classifier.pkl")
INTENT_CLASSIFIER_PATH = os.path.join(DATA_DIR, "intent_classifier.pkl")
USER_PROFILES_PATH = os.path.join(DATA_DIR, "user_profiles.json")

# Override file paths in the model instance
nlp_model.mood_classifier_path = MOOD_CLASSIFIER_PATH
nlp_model.intent_classifier_path = INTENT_CLASSIFIER_PATH
nlp_model.user_profiles_path = USER_PROFILES_PATH

# Reload models and user data with new paths if necessary
if not os.path.exists(MOOD_CLASSIFIER_PATH) or not os.path.exists(
    INTENT_CLASSIFIER_PATH
):
    print(
        f"Warning: Classifier .pkl files not found at {DATA_DIR}. The model might try to retrain or fail."
    )
else:
    nlp_model.load_models()  # Ensure models are loaded from the correct path

if not os.path.exists(USER_PROFILES_PATH):
    print(
        f"User profiles file not found at {USER_PROFILES_PATH}. A new one may be created."
    )
else:
    nlp_model.load_user_data()  # Ensure user data is loaded


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": 'Missing "text" in request body'}), 400

    text = data["text"]
    try:
        mood, mood_prob, intent, intent_prob = nlp_model.predict_mood_and_intent(text)
        return jsonify(
            {
                "mood": mood,
                "mood_probability": mood_prob,
                "intent": intent,
                "intent_probability": intent_prob,
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/profile/<user_id>", methods=["POST"])
def update_profile(user_id):
    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"error": 'Missing "message" in request body'}), 400

    message = data["message"]
    feedback = data.get("feedback")
    rating = data.get("rating")

    try:
        updated_profile = nlp_model.update_user_profile(
            user_id, message, feedback, rating
        )
        return jsonify(updated_profile)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/profile/<user_id>", methods=["GET"])
def get_profile(user_id):
    try:
        insights = nlp_model.get_user_insights(user_id)
        if not insights:
            return jsonify({"error": "User profile not found"}), 404
        return jsonify(insights)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Make sure to adjust host and port as needed for your environment
    # Using 0.0.0.0 to be accessible externally if running in a container/VM
    app.run(host="0.0.0.0", port=5000, debug=True)
