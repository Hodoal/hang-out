import json
import pickle
import os
from datetime import datetime
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import re
from typing import Dict, List, Tuple

class BarranquillaNLPModel:
    def __init__(self):
        self.mood_classifier = None
        self.intent_classifier = None
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words=None)
        self.user_profiles = {}
        self.conversation_data = []
        
        # Cargar datos existentes si existen
        self.load_models()
        self.load_user_data()
        
        # Si no hay modelos entrenados, crear datasets iniciales
        if self.mood_classifier is None:
            self.create_initial_datasets()
            self.train_models()
    
    def create_initial_datasets(self):
        """Crear datasets iniciales para entrenar los modelos"""
        
        # Dataset para clasificación de estados de ánimo
        self.mood_dataset = [
            # Feliz/Energético
            ("me siento genial", "energetico"),
            ("estoy súper bien", "energetico"),
            ("me siento increíble", "energetico"),
            ("estoy de buen humor", "energetico"),
            ("me siento genial hoy", "energetico"),
            ("estoy muy animado", "energetico"),
            ("me siento feliz", "energetico"),
            ("estoy de maravilla", "energetico"),
            ("me siento eufórico", "energetico"),
            ("estoy súper emocionado", "energetico"),
            
            # Relajado/Tranquilo
            ("quiero relajarme", "relajado"),
            ("necesito paz", "relajado"),
            ("busco tranquilidad", "relajado"),
            ("quiero algo calmado", "relajado"),
            ("necesito descansar", "relajado"),
            ("quiero un lugar tranquilo", "relajado"),
            ("busco serenidad", "relajado"),
            ("me siento cansado", "relajado"),
            ("quiero desestresarme", "relajado"),
            ("necesito un respiro", "relajado"),
            
            # Estresado/Ansioso
            ("estoy estresado", "estresado"),
            ("me siento agobiado", "estresado"),
            ("tengo ansiedad", "estresado"),
            ("estoy muy nervioso", "estresado"),
            ("me siento abrumado", "estresado"),
            ("tengo mucha presión", "estresado"),
            ("estoy muy tenso", "estresado"),
            ("me siento angustiado", "estresado"),
            ("estoy preocupado", "estresado"),
            ("me siento inquieto", "estresado"),
            
            # Romántico
            ("busco algo romántico", "romantico"),
            ("quiero una cita", "romantico"),
            ("algo para parejas", "romantico"),
            ("lugar romántico", "romantico"),
            ("quiero impresionar", "romantico"),
            ("busco romance", "romantico"),
            ("algo íntimo", "romantico"),
            ("para una cita especial", "romantico"),
            ("quiero algo bonito para dos", "romantico"),
            ("lugar para enamorados", "romantico"),
            
            # Aventurero
            ("quiero aventura", "aventurero"),
            ("busco emoción", "aventurero"),
            ("algo extremo", "aventurero"),
            ("quiero adrenalina", "aventurero"),
            ("busco diversión", "aventurero"),
            ("algo emocionante", "aventurero"),
            ("quiero explorar", "aventurero"),
            ("busco algo nuevo", "aventurero"),
            ("quiero una experiencia única", "aventurero"),
            ("algo diferente", "aventurero"),
            
            # Cultural
            ("quiero cultura", "cultural"),
            ("algo histórico", "cultural"),
            ("busco arte", "cultural"),
            ("quiero aprender", "cultural"),
            ("algo educativo", "cultural"),
            ("me gusta la historia", "cultural"),
            ("quiero museos", "cultural"),
            ("busco tradiciones", "cultural"),
            ("algo típico", "cultural"),
            ("quiero conocer la ciudad", "cultural")
        ]
        
        # Dataset para clasificación de intenciones
        self.intent_dataset = [
            # Comer
            ("tengo hambre", "comer"),
            ("quiero comer", "comer"),
            ("busco restaurante", "comer"),
            ("donde puedo comer", "comer"),
            ("quiero probar comida", "comer"),
            ("busco algo típico", "comer"),
            ("quiero almorzar", "comer"),
            ("quiero cenar", "comer"),
            ("busco mariscos", "comer"),
            ("quiero comida caribeña", "comer"),
            ("donde venden arepa", "comer"),
            ("quiero sancocho", "comer"),
            
            # Entretenimiento/Diversión
            ("quiero divertirme", "entretenimiento"),
            ("busco diversión", "entretenimiento"),
            ("donde puedo bailar", "entretenimiento"),
            ("quiero rumba", "entretenimiento"),
            ("busco discoteca", "entretenimiento"),
            ("quiero fiesta", "entretenimiento"),
            ("donde hay música", "entretenimiento"),
            ("quiero bailar salsa", "entretenimiento"),
            ("busco bar", "entretenimiento"),
            ("vida nocturna", "entretenimiento"),
            
            # Compras
            ("quiero comprar", "compras"),
            ("busco tiendas", "compras"),
            ("donde puedo comprar", "compras"),
            ("quiero souvenirs", "compras"),
            ("busco centro comercial", "compras"),
            ("quiero ir de compras", "compras"),
            ("busco artesanías", "compras"),
            ("donde venden ropa", "compras"),
            ("quiero mercado", "compras"),
            ("busco recuerdos", "compras"),
            
            # Naturaleza/Aire libre
            ("quiero naturaleza", "naturaleza"),
            ("busco parque", "naturaleza"),
            ("quiero aire libre", "naturaleza"),
            ("donde puedo caminar", "naturaleza"),
            ("busco playa", "naturaleza"),
            ("quiero río", "naturaleza"),
            ("algo al aire libre", "naturaleza"),
            ("quiero verde", "naturaleza"),
            ("busco jardín", "naturaleza"),
            ("quiero ejercitarme", "naturaleza"),
            
            # Cultura/Historia
            ("quiero historia", "cultura"),
            ("busco museos", "cultura"),
            ("algo cultural", "cultura"),
            ("quiero aprender", "cultura"),
            ("busco arte", "cultura"),
            ("donde hay cultura", "cultura"),
            ("quiero tradiciones", "cultura"),
            ("algo histórico", "cultura"),
            ("busco monumentos", "cultura"),
            ("quiero conocer la ciudad", "cultura"),
            
            # Descanso/Relajación
            ("quiero descansar", "descanso"),
            ("busco relajación", "descanso"),
            ("donde puedo relajarme", "descanso"),
            ("quiero spa", "descanso"),
            ("busco tranquilidad", "descanso"),
            ("quiero meditar", "descanso"),
            ("lugar silencioso", "descanso"),
            ("quiero paz", "descanso"),
            ("busco serenidad", "descanso"),
            ("donde puedo desestresarme", "descanso")
        ]
    
    def preprocess_text(self, text: str) -> str:
        """Preprocesar texto para análisis"""
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def train_models(self):
        """Entrenar los modelos de clasificación"""
        # Preparar datos para estado de ánimo
        mood_texts = [self.preprocess_text(text) for text, _ in self.mood_dataset]
        mood_labels = [label for _, label in self.mood_dataset]
        
        # Preparar datos para intenciones
        intent_texts = [self.preprocess_text(text) for text, _ in self.intent_dataset]
        intent_labels = [label for _, label in self.intent_dataset]
        
        # Entrenar clasificador de estado de ánimo
        self.mood_classifier = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=500, ngram_range=(1, 2))),
            ('clf', SVC(kernel='linear', probability=True))
        ])
        self.mood_classifier.fit(mood_texts, mood_labels)
        
        # Entrenar clasificador de intenciones
        self.intent_classifier = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=500, ngram_range=(1, 2))),
            ('clf', SVC(kernel='linear', probability=True))
        ])
        self.intent_classifier.fit(intent_texts, intent_labels)
        
        # Guardar modelos
        self.save_models()
        print("Modelos entrenados y guardados exitosamente")
    
    def predict_mood_and_intent(self, text: str) -> Tuple[str, float, str, float]:
        """Predecir estado de ánimo e intención"""
        processed_text = self.preprocess_text(text)
        
        # Predecir estado de ánimo
        mood_pred = self.mood_classifier.predict([processed_text])[0]
        mood_prob = max(self.mood_classifier.predict_proba([processed_text])[0])
        
        # Predecir intención
        intent_pred = self.intent_classifier.predict([processed_text])[0]
        intent_prob = max(self.intent_classifier.predict_proba([processed_text])[0])
        
        return mood_pred, mood_prob, intent_pred, intent_prob
    
    def update_user_profile(self, user_id: str, message: str, feedback: str = None, rating: int = None) -> Dict:
        """Actualizar perfil del usuario basado en mensaje y feedback"""
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = {
                'preferences': [],
                'mood_history': [],
                'location_ratings': {},
                'conversation_count': 0,
                'avg_rating': 0.0,
                'favorite_categories': [],
                'last_interactions': []
            }
        
        profile = self.user_profiles[user_id]
        profile['conversation_count'] += 1
        
        # Analizar mensaje actual
        mood, mood_conf, intent, intent_conf = self.predict_mood_and_intent(message)
        
        # Actualizar historial de estados de ánimo
        profile['mood_history'].append({
            'mood': mood,
            'confidence': mood_conf,
            'timestamp': datetime.now().isoformat()
        })
        
        # Mantener solo los últimos 10 estados de ánimo
        if len(profile['mood_history']) > 10:
            profile['mood_history'] = profile['mood_history'][-10:]
        
        # Agregar intención a preferencias si la confianza es alta
        if intent_conf > 0.6 and intent not in profile['preferences']:
            profile['preferences'].append(intent)
        
        # Procesar feedback y rating
        if feedback and rating:
            # Actualizar calificaciones
            if rating >= 4:
                if intent not in profile['favorite_categories']:
                    profile['favorite_categories'].append(intent)
            
            # Calcular rating promedio
            ratings = list(profile['location_ratings'].values())
            if ratings:
                profile['avg_rating'] = sum(ratings) / len(ratings)
        
        # Guardar interacción actual
        interaction = {
            'message': message,
            'mood': mood,
            'intent': intent,
            'feedback': feedback,
            'rating': rating,
            'timestamp': datetime.now().isoformat()
        }
        
        profile['last_interactions'].append(interaction)
        if len(profile['last_interactions']) > 5:
            profile['last_interactions'] = profile['last_interactions'][-5:]
        
        # Guardar datos actualizados
        self.save_user_data()
        
        return profile
    
    def get_user_insights(self, user_id: str) -> Dict:
        """Obtener insights del usuario para personalización"""
        if user_id not in self.user_profiles:
            return {}
        
        profile = self.user_profiles[user_id]
        
        # Analizar patrones de estado de ánimo
        recent_moods = [entry['mood'] for entry in profile['mood_history'][-5:]]
        mood_pattern = max(set(recent_moods), key=recent_moods.count) if recent_moods else "neutral"
        
        # Preferencias principales
        top_preferences = profile['favorite_categories'][:3] if profile['favorite_categories'] else profile['preferences'][:3]
        
        return {
            'dominant_mood': mood_pattern,
            'top_preferences': top_preferences,
            'avg_rating': profile['avg_rating'],
            'conversation_count': profile['conversation_count'],
            'is_new_user': profile['conversation_count'] <= 2
        }
    
    def save_models(self):
        """Guardar modelos entrenados"""
        try:
            with open('mood_classifier.pkl', 'wb') as f:
                pickle.dump(self.mood_classifier, f)
            with open('intent_classifier.pkl', 'wb') as f:
                pickle.dump(self.intent_classifier, f)
        except Exception as e:
            print(f"Error guardando modelos: {e}")
    
    def load_models(self):
        """Cargar modelos entrenados"""
        try:
            if os.path.exists('mood_classifier.pkl'):
                with open('mood_classifier.pkl', 'rb') as f:
                    self.mood_classifier = pickle.load(f)
            if os.path.exists('intent_classifier.pkl'):
                with open('intent_classifier.pkl', 'rb') as f:
                    self.intent_classifier = pickle.load(f)
        except Exception as e:
            print(f"Error cargando modelos: {e}")
    
    def save_user_data(self):
        """Guardar datos de usuarios"""
        try:
            with open('user_profiles.json', 'w', encoding='utf-8') as f:
                json.dump(self.user_profiles, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error guardando datos de usuarios: {e}")
    
    def load_user_data(self):
        """Cargar datos de usuarios"""
        try:
            if os.path.exists('user_profiles.json'):
                with open('user_profiles.json', 'r', encoding='utf-8') as f:
                    self.user_profiles = json.load(f)
        except Exception as e:
            print(f"Error cargando datos de usuarios: {e}")
    
    def retrain_with_feedback(self, user_message: str, correct_mood: str, correct_intent: str):
        """Reentrenar modelos con feedback del usuario"""
        # Agregar nuevos datos a los datasets
        processed_message = self.preprocess_text(user_message)
        
        self.mood_dataset.append((processed_message, correct_mood))
        self.intent_dataset.append((processed_message, correct_intent))
        
        # Reentrenar modelos
        self.train_models()
        print("Modelos reentrenados con nuevo feedback")

# Ejemplo de uso y testing
if __name__ == "__main__":
    # Crear instancia del modelo
    nlp_model = BarranquillaNLPModel()
    
    # Probar predicciones
    test_messages = [
        "me siento muy estresado y necesito relajarme",
        "quiero comer algo típico de la costa",
        "estoy súper feliz y quiero bailar",
        "busco un lugar romántico para una cita",
        "quiero conocer la historia de Barranquilla"
    ]
    
    print("=== PRUEBAS DEL MODELO ===")
    for msg in test_messages:
        mood, mood_conf, intent, intent_conf = nlp_model.predict_mood_and_intent(msg)
        print(f"\nMensaje: '{msg}'")
        print(f"Estado de ánimo: {mood} (confianza: {mood_conf:.2f})")
        print(f"Intención: {intent} (confianza: {intent_conf:.2f})")
    
    # Probar actualización de perfil
    print("\n=== PRUEBA DE PERFIL DE USUARIO ===")
    user_id = "test_user"
    
    for i, msg in enumerate(test_messages):
        rating = np.random.randint(3, 6)  # Rating aleatorio entre 3-5
        feedback = "me gustó" if rating >= 4 else "estuvo ok"
        
        profile = nlp_model.update_user_profile(user_id, msg, feedback, rating)
        print(f"\nInteracción #{i+1}")
        print(f"Mensaje: {msg}")
        print(f"Perfil actualizado - Conversaciones: {profile['conversation_count']}")
        print(f"Preferencias: {profile['preferences']}")
        print(f"Rating promedio: {profile['avg_rating']:.1f}")
    
    # Obtener insights finales
    insights = nlp_model.get_user_insights(user_id)
    print(f"\n=== INSIGHTS DEL USUARIO ===")
    print(f"Estado de ánimo dominante: {insights['dominant_mood']}")
    print(f"Preferencias principales: {insights['top_preferences']}")
    print(f"Usuario nuevo: {insights['is_new_user']}")