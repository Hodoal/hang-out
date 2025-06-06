from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import hashlib
from model import BarranquillaNLPModel
import json
from datetime import datetime

# Crear aplicación Flask
app = Flask(__name__)
CORS(app)  # Permitir requests desde React Native

# Inicializar modelo NLP
nlp_model = BarranquillaNLPModel()

def generate_user_id(device_info=None):
    """Generar ID único para el usuario basado en información del dispositivo"""
    if device_info:
        # En producción, usar información del dispositivo
        user_string = f"{device_info.get('platform', 'unknown')}_{device_info.get('version', 'unknown')}"
    else:
        # Para desarrollo, generar ID aleatorio
        user_string = str(uuid.uuid4())
    
    return hashlib.md5(user_string.encode()).hexdigest()[:16]

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint para verificar que el servidor está funcionando"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": nlp_model.mood_classifier is not None
    })

@app.route('/analyze_message', methods=['POST'])
def analyze_message():
    """Analizar mensaje del usuario y devolver estado de ánimo e intención"""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({"error": "Mensaje requerido"}), 400
        
        message = data['message']
        
        # Predecir estado de ánimo e intención
        mood, mood_conf, intent, intent_conf = nlp_model.predict_mood_and_intent(message)
        
        return jsonify({
            "mood": mood,
            "mood_confidence": float(mood_conf),
            "intent": intent,
            "intent_confidence": float(intent_conf),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": f"Error analizando mensaje: {str(e)}"}), 500

@app.route('/update_profile', methods=['POST'])
def update_profile():
    """Actualizar perfil del usuario con mensaje y feedback"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Datos requeridos"}), 400
        
        # Extraer datos
        message = data.get('message', '')
        feedback = data.get('feedback', None)
        rating = data.get('rating', None)
        current_profile = data.get('current_profile', {})
        conversation_history = data.get('conversation_history', [])
        
        # Generar user_id (en producción, esto vendría del cliente)
        user_id = data.get('user_id', 'default_user')
        
        # Si hay perfil actual, usarlo para inicializar
        if current_profile and user_id not in nlp_model.user_profiles:
            nlp_model.user_profiles[user_id] = current_profile
        
        # Actualizar perfil
        updated_profile = nlp_model.update_user_profile(user_id, message, feedback, rating)
        
        # Obtener insights del usuario
        insights = nlp_model.get_user_insights(user_id)
        
        # Analizar mensaje actual
        mood, mood_conf, intent, intent_conf = nlp_model.predict_mood_and_intent(message) if message else ("neutral", 0.5, "general", 0.5)
        
        # Generar recomendaciones personalizadas basadas en el perfil
        personalization_tips = generate_personalization_tips(updated_profile, insights)
        
        return jsonify({
            "user_profile": updated_profile,
            "insights": insights,
            "current_analysis": {
                "mood": mood,
                "mood_confidence": float(mood_conf),
                "intent": intent,
                "intent_confidence": float(intent_conf)
            },
            "personalization_tips": personalization_tips,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": f"Error actualizando perfil: {str(e)}"}), 500

@app.route('/get_user_profile', methods=['POST'])
def get_user_profile():
    """Obtener perfil completo del usuario"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default_user')
        
        if user_id in nlp_model.user_profiles:
            profile = nlp_model.user_profiles[user_id]
            insights = nlp_model.get_user_insights(user_id)
            
            return jsonify({
                "user_profile": profile,
                "insights": insights,
                "found": True
            })
        else:
            return jsonify({
                "user_profile": {},
                "insights": {},
                "found": False
            })
            
    except Exception as e:
        return jsonify({"error": f"Error obteniendo perfil: {str(e)}"}), 500

@app.route('/personalized_context', methods=['POST'])
def get_personalized_context():
    """Generar contexto personalizado para enviar a DeepSeek R1"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default_user')
        current_message = data.get('message', '')
        
        # Obtener perfil e insights
        if user_id in nlp_model.user_profiles:
            profile = nlp_model.user_profiles[user_id]
            insights = nlp_model.get_user_insights(user_id)
        else:
            profile = {}
            insights = {"is_new_user": True}
        
        # Analizar mensaje actual
        mood, mood_conf, intent, intent_conf = nlp_model.predict_mood_and_intent(current_message)
        
        # Generar contexto personalizado
        context = generate_deepseek_context(profile, insights, mood, intent, mood_conf, intent_conf)
        
        return jsonify({
            "personalized_context": context,
            "current_mood": mood,
            "current_intent": intent,
            "confidence_scores": {
                "mood": float(mood_conf),
                "intent": float(intent_conf)
            },
            "user_insights": insights
        })
        
    except Exception as e:
        return jsonify({"error": f"Error generando contexto: {str(e)}"}), 500

@app.route('/feedback', methods=['POST'])
def process_feedback():
    """Procesar feedback para mejorar el modelo"""
    try:
        data = request.get_json()
        
        user_message = data.get('message', '')
        correct_mood = data.get('correct_mood', '')
        correct_intent = data.get('correct_intent', '')
        
        if user_message and correct_mood and correct_intent:
            # Reentrenar modelo con feedback
            nlp_model.retrain_with_feedback(user_message, correct_mood, correct_intent)
            
            return jsonify({
                "message": "Feedback procesado y modelo actualizado",
                "status": "success"
            })
        else:
            return jsonify({"error": "Datos de feedback incompletos"}), 400
            
    except Exception as e:
        return jsonify({"error": f"Error procesando feedback: {str(e)}"}), 500

def generate_personalization_tips(profile, insights):
    """Generar tips de personalización basados en el perfil del usuario"""
    tips = []
    
    # Tips basados en preferencias
    if 'comer' in insights.get('top_preferences', []):
        tips.append("Este usuario disfruta de experiencias gastronómicas - recomienda restaurantes y comida típica")
    
    if 'entretenimiento' in insights.get('top_preferences', []):
        tips.append("Le gusta la diversión y entretenimiento - sugiere vida nocturna y actividades sociales")
    
    if 'cultura' in insights.get('top_preferences', []):
        tips.append("Interesado en cultura e historia - recomienda museos, monumentos y sitios históricos")
    
    if 'naturaleza' in insights.get('top_preferences', []):
        tips.append("Disfruta la naturaleza - sugiere parques, playa y actividades al aire libre")
    
    # Tips basados en patrones de estado de ánimo
    dominant_mood = insights.get('dominant_mood', '')
    if dominant_mood == 'estresado':
        tips.append("Usuario frecuentemente estresado - prioriza lugares tranquilos y relajantes")
    elif dominant_mood == 'energetico':
        tips.append("Usuario generalmente energético - sugiere actividades dinámicas y emocionantes")
    elif dominant_mood == 'relajado':
        tips.append("Prefiere ambientes tranquilos - recomienda lugares apacibles")
    
    # Tips basados en experiencia
    if insights.get('is_new_user'):
        tips.append("Usuario nuevo - da información básica sobre Barranquilla y lugares icónicos")
    elif insights.get('conversation_count', 0) > 10:
        tips.append("Usuario experimentado - puede sugerir lugares menos conocidos y experiencias únicas")
    
    # Tips basados en ratings
    avg_rating = insights.get('avg_rating', 0)
    if avg_rating >= 4.5:
        tips.append("Usuario muy satisfecho con recomendaciones previas - mantén el nivel de calidad")
    elif avg_rating < 3:
        tips.append("Usuario no muy satisfecho - ajusta el tipo de recomendaciones")
    
    return tips

def generate_deepseek_context(profile, insights, current_mood, current_intent, mood_conf, intent_conf):
    """Generar contexto personalizado para DeepSeek R1"""
    
    # Información básica del usuario
    context = []
    
    if insights.get('is_new_user'):
        context.append("USUARIO NUEVO: Proporciona información básica sobre Barranquilla")
    else:
        context.append(f"Usuario con {insights.get('conversation_count', 0)} conversaciones previas")
    
    # Estado de ánimo actual
    context.append(f"ESTADO ACTUAL: {current_mood} (confianza: {mood_conf:.1f})")
    context.append(f"INTENCIÓN: {current_intent} (confianza: {intent_conf:.1f})")
    
    # Preferencias principales
    top_prefs = insights.get('top_preferences', [])
    if top_prefs:
        context.append(f"PREFERENCIAS PRINCIPALES: {', '.join(top_prefs)}")
    
    # Historial de estados de ánimo
    if profile.get('mood_history'):
        recent_moods = [entry['mood'] for entry in profile['mood_history'][-3:]]
        context.append(f"ESTADOS RECIENTES: {' → '.join(recent_moods)}")
    
    # Rating promedio
    avg_rating = insights.get('avg_rating', 0)
    if avg_rating > 0:
        context.append(f"SATISFACCIÓN PROMEDIO: {avg_rating:.1f}/5.0")
    
    # Lugares mejor calificados
    location_ratings = profile.get('location_ratings', {})
    high_rated = [place for place, rating in location_ratings.items() if rating >= 4]
    if high_rated:
        context.append(f"LUGARES QUE LE GUSTARON: {', '.join(high_rated[:3])}")
    
    # Recomendaciones específicas basadas en el análisis
    recommendations = []
    
    if current_intent == 'comer' and current_mood == 'estresado':
        recommendations.append("Recomienda lugares tranquilos para comer, evita lugares muy concurridos")
    elif current_intent == 'comer' and current_mood == 'feliz':
        recommendations.append("Sugiere experiencias gastronómicas divertidas y sociales")
    elif current_intent == 'entretenimiento' and current_mood == 'energetico':
        recommendations.append("Recomienda vida nocturna activa y lugares con música en vivo")
    elif current_intent == 'cultura' and current_mood == 'relajado':
        recommendations.append("Sugiere museos tranquilos y sitios históricos contemplativos")
    elif current_intent == 'naturaleza':
        if current_mood == 'estresado':
            recommendations.append("Prioriza parques tranquilos y lugares junto al mar para relajarse")
        else:
            recommendations.append("Sugiere actividades al aire libre y experiencias en la naturaleza")
    
    if recommendations:
        context.extend(recommendations)
    
    # Instrucciones especiales
    special_instructions = []
    
    if avg_rating < 3:
        special_instructions.append("ATENCIÓN: Usuario no muy satisfecho - ajusta recomendaciones")
    
    if insights.get('conversation_count', 0) > 5:
        special_instructions.append("Usuario experimentado - evita repetir lugares ya recomendados")
    
    if special_instructions:
        context.extend(special_instructions)
    
    return "\n".join(context)

@app.route('/save_interaction', methods=['POST'])
def save_interaction():
    """Guardar interacción completa (mensaje + respuesta + rating)"""
    try:
        data = request.get_json()
        
        user_id = data.get('user_id', 'default_user')
        user_message = data.get('user_message', '')
        bot_response = data.get('bot_response', '')
        recommended_place = data.get('recommended_place', '')
        rating = data.get('rating', None)
        
        # Analizar mensaje del usuario
        mood, mood_conf, intent, intent_conf = nlp_model.predict_mood_and_intent(user_message)
        
        # Actualizar perfil con la interacción completa
        updated_profile = nlp_model.update_user_profile(
            user_id=user_id,
            message=user_message,
            feedback=f"Lugar recomendado: {recommended_place}",
            rating=rating
        )
        
        # Si hay rating, asociarlo al lugar específico
        if rating and recommended_place:
            if user_id not in nlp_model.user_profiles:
                nlp_model.user_profiles[user_id] = {}
            
            if 'location_ratings' not in nlp_model.user_profiles[user_id]:
                nlp_model.user_profiles[user_id]['location_ratings'] = {}
            
            nlp_model.user_profiles[user_id]['location_ratings'][recommended_place] = rating
        
        return jsonify({
            "message": "Interacción guardada exitosamente",
            "user_profile": updated_profile,
            "analysis": {
                "mood": mood,
                "intent": intent,
                "confidence": {
                    "mood": float(mood_conf),
                    "intent": float(intent_conf)
                }
            }
        })
        
    except Exception as e:
        return jsonify({"error": f"Error guardando interacción: {str(e)}"}), 500

@app.route('/get_recommendations_history', methods=['POST'])
def get_recommendations_history():
    """Obtener historial de recomendaciones del usuario"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default_user')
        
        if user_id in nlp_model.user_profiles:
            profile = nlp_model.user_profiles[user_id]
            
            # Extraer historial de lugares con ratings
            location_ratings = profile.get('location_ratings', {})
            
            # Extraer historial de conversaciones
            conversation_history = profile.get('conversation_history', [])
            
            # Obtener lugares mejor y peor calificados
            if location_ratings:
                best_places = sorted(location_ratings.items(), key=lambda x: x[1], reverse=True)[:5]
                worst_places = sorted(location_ratings.items(), key=lambda x: x[1])[:3]
            else:
                best_places = []
                worst_places = []
            
            return jsonify({
                "location_ratings": location_ratings,
                "conversation_history": conversation_history[-10:],  # Últimas 10 conversaciones
                "best_places": best_places,
                "worst_places": worst_places,
                "total_interactions": len(conversation_history)
            })
        else:
            return jsonify({
                "location_ratings": {},
                "conversation_history": [],
                "best_places": [],
                "worst_places": [],
                "total_interactions": 0
            })
            
    except Exception as e:
        return jsonify({"error": f"Error obteniendo historial: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Iniciando servidor de BarranquillaChatBot...")
    print("📡 Endpoints disponibles:")
    print("  - GET  /health - Estado del servidor")
    print("  - POST /analyze_message - Analizar mensaje del usuario")
    print("  - POST /update_profile - Actualizar perfil del usuario")
    print("  - POST /get_user_profile - Obtener perfil del usuario")
    print("  - POST /personalized_context - Contexto personalizado para DeepSeek")
    print("  - POST /feedback - Procesar feedback del modelo")
    print("  - POST /save_interaction - Guardar interacción completa")
    print("  - POST /get_recommendations_history - Historial de recomendaciones")
    print()
    print("🧠 Modelo NLP cargado y listo para usar")
    print("🌐 CORS habilitado para React Native")
    print()
    app.run(host='0.0.0.0', port=8080, debug=True)