"""
generate_dummy_model.py
=======================
Generates a minimal valid Keras model at backend/ai/model/price_model.keras.

The model accepts a (1, 5) float32 input vector:
    [quantity, crop_type_enc, unit_enc, location_enc, season_enc]

and returns a (1, 1) float32 output — the predicted price.

This is a randomly-initialised network suitable for development, integration
testing, and demos. It produces plausible-looking (but not accurate) prices.

Usage
-----
Run from the backend/ directory with tensorflow installed:

    python scripts/generate_dummy_model.py

Or with the project venv explicitly:

    C:\\Users\\WELCOME\\Desktop\\workspace\\demo-hack-env\\Scripts\\python.exe scripts/generate_dummy_model.py
"""

import os
import sys


def main() -> None:
    try:
        import numpy as np
        import tensorflow as tf
    except ImportError as exc:
        print(f"ERROR: {exc}")
        print()
        print("Install tensorflow first:")
        print("  uv add tensorflow")
        print("  # or")
        print("  pip install tensorflow")
        sys.exit(1)

    output_dir = os.path.join(os.path.dirname(__file__), "..", "ai", "model")
    output_path = os.path.join(output_dir, "price_model.keras")
    output_path = os.path.normpath(output_path)

    os.makedirs(output_dir, exist_ok=True)

    print(f"TensorFlow version : {tf.__version__}")
    print(f"Output path        : {output_path}")
    print()

    # Build a small dense regression network.
    # Input shape (5,) matches PredictionService._encode_features output:
    #   [quantity, crop_type_enc, unit_enc, location_enc, season_enc]
    model = tf.keras.Sequential(
        [
            tf.keras.layers.Dense(32, activation="relu", input_shape=(5,)),
            tf.keras.layers.Dense(16, activation="relu"),
            tf.keras.layers.Dense(1, activation="relu"),  # relu keeps price >= 0
        ],
        name="price_prediction_dummy",
    )
    model.compile(optimizer="adam", loss="mse")

    # Minimal training so weights are initialised and the model is saveable.
    # Synthetic data: price roughly scales with quantity (100–900 NGN range).
    np.random.seed(42)
    n = 200
    X = np.random.rand(n, 5).astype("float32")
    X[:, 0] = np.random.uniform(1, 500, n)  # quantity column — realistic range
    y = (X[:, 0] * np.random.uniform(1, 5, n)).reshape(-1, 1).astype("float32")

    model.fit(X, y, epochs=3, batch_size=32, verbose=0)

    model.save(output_path)

    # Smoke-test: load it back and run one inference
    loaded = tf.keras.models.load_model(output_path)
    test_input = np.array([[50.0, 0.35, 0.12, 0.78, 0.55]], dtype="float32")
    prediction = loaded.predict(test_input, verbose=0)

    print("Model saved successfully.")
    print(f"Smoke-test prediction for input {test_input.tolist()}: {prediction[0][0]:.2f}")
    print()
    print("Next steps:")
    print("  1. Set AI_MODEL_PATH in your .env (or leave blank to use the default):")
    print(f"     AI_MODEL_PATH=ai/model/price_model.keras")
    print("  2. Start the server — AiConfig.ready() will load the model at startup.")
    print("  3. POST to /api/ai/predict-price/ with a valid JWT token.")


if __name__ == "__main__":
    main()
