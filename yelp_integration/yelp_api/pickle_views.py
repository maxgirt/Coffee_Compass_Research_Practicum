# Used to load in predictions via pickle models

from django.http import JsonResponse
from rest_framework.decorators import api_view
import os
import pickle

@api_view(['GET'])
def model_output_api(request, hour, day, month, week_of_month):
    print(f"Hour: {hour}")
    print(f"Day: {day}")
    print(f"Month: {month}")
    print(f"Week of Month: {week_of_month}")

    # Define the model numbers you want to include
    model_numbers = [4, 12, 13, 24, 41, 42, 43, 45, 48, 50, 68, 74, 75, 79, 87, 88, 90, 100, 107, 113,
                114, 116, 120, 125, 127, 128, 137, 140, 141, 142, 143, 144, 148, 151, 152, 153,
                158, 161, 162, 163, 164, 166, 170, 186, 194, 202, 209, 211, 224, 229, 230, 231,
                232, 233, 234, 236, 237, 238, 239, 243, 244, 246, 249, 261, 262, 263]

    # Prepare the inputs
    inputs = [hour, day, month, week_of_month]

    # Load pickle files and make predictions for each model
    predictions = {}
    for model_number in model_numbers:
        pickle_file = os.path.join('pickle_models', f'model_{model_number}.pkl')
        with open(pickle_file, 'rb') as f:
            model = pickle.load(f)

        prediction = model.predict([inputs])
        predictions[f'model_{model_number}'] = prediction.tolist()  # Convert NumPy array to Python list

    # Return the predictions as a JSON response
    response_data = {
        'predictions': predictions
    }
    return JsonResponse(response_data)
