import joblib

pipeline = joblib.load("preterm_full_pipeline.pkl")

# If you used ColumnTransformer
# print(pipeline.named_steps)  # lists steps like preprocessor, classifier

 # shows which columns are treated as numeric/categorical


import numpy, pandas, sklearn, joblib, fastapi, uvicorn
print(numpy.__version__)
print(pandas.__version__)
print(sklearn.__version__)
print(fastapi.__version__)
print(joblib.__version__)
print(uvicorn.__version__)
