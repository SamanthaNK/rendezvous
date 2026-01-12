from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

logger.info("Loading sentence-transformers model...")
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
logger.info("Model loaded successfully")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model': 'sentence-transformers/all-MiniLM-L6-v2',
        'embedding_dim': 384
    })

@app.route('/embed', methods=['POST'])
def generate_embedding():
    try:
        data = request.get_json()

        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing text field in request body'
            }), 400

        text = data['text']

        if not text or len(text.strip()) == 0:
            return jsonify({
                'success': False,
                'error': 'Text cannot be empty'
            }), 400

        logger.info(f"Generating embedding for text length: {len(text)}")

        embedding = model.encode(text[:500])

        embedding_list = embedding.tolist()

        logger.info(f"Embedding generated successfully, dimensions: {len(embedding_list)}")

        return jsonify({
            'success': True,
            'embedding': embedding_list,
            'dimensions': len(embedding_list)
        })

    except Exception as e:
        logger.error(f"Embedding generation failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/embed/batch', methods=['POST'])
def generate_batch_embeddings():
    try:
        data = request.get_json()

        if not data or 'texts' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing texts field in request body'
            }), 400

        texts = data['texts']

        if not isinstance(texts, list):
            return jsonify({
                'success': False,
                'error': 'texts must be an array'
            }), 400

        if len(texts) == 0:
            return jsonify({
                'success': False,
                'error': 'texts array cannot be empty'
            }), 400

        truncated_texts = [text[:500] for text in texts]

        logger.info(f"Generating embeddings for {len(texts)} texts")

        embeddings = model.encode(truncated_texts)

        embeddings_list = embeddings.tolist()

        logger.info(f"Batch embeddings generated successfully")

        return jsonify({
            'success': True,
            'embeddings': embeddings_list,
            'count': len(embeddings_list),
            'dimensions': len(embeddings_list[0]) if embeddings_list else 0
        })

    except Exception as e:
        logger.error(f"Batch embedding generation failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/similarity', methods=['POST'])
def calculate_similarity():
    try:
        data = request.get_json()

        if not data or 'text1' not in data or 'text2' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing text1 or text2 in request body'
            }), 400

        text1 = data['text1'][:500]
        text2 = data['text2'][:500]

        logger.info("Calculating similarity between two texts")

        embeddings = model.encode([text1, text2])

        embedding1 = embeddings[0]
        embedding2 = embeddings[1]

        dot_product = np.dot(embedding1, embedding2)
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)

        similarity = float(dot_product / (norm1 * norm2))

        logger.info(f"Similarity calculated: {similarity:.4f}")

        return jsonify({
            'success': True,
            'similarity': similarity,
            'text1_length': len(text1),
            'text2_length': len(text2)
        })

    except Exception as e:
        logger.error(f"Similarity calculation failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("\n" + "="*50)
    print("  Rendezvous Embedding Service")
    print("  Running on http://localhost:5001")
    print("="*50 + "\n")

    app.run(host='0.0.0.0', port=5001, debug=False)