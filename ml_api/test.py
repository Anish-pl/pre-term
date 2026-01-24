import joblib

pipe = joblib.load("final_preterm_full_pipeline.pkl")
print(pipe)
preprocessor = pipe.named_steps["preprocessor"]
# print(preprocessor)
num_pipeline = preprocessor.named_transformers_["num"]
print(num_pipeline)
imputer = num_pipeline.named_steps["imputer"]
scaler = num_pipeline.named_steps["scaler"]
print(scaler)
print(imputer)
numeric_features = num_pipeline.feature_names_in_
medians = imputer.statistics_
print("\nNUMERIC SCALER PARAMETERS")
for f, mean, scale in zip(
    numeric_features,
    scaler.mean_,
    scaler.scale_
):
    print(f"{f}: mean={mean}, std={scale}")


# ORDINAL TRANSFORMER
ord_transformer = preprocessor.named_transformers_["ord"]

for name, transformer, features in preprocessor.transformers_:
    if name == "ord":
        ordinal_features = features

print("\nORDINAL FEATURES (PASSTHROUGH)")
print(ordinal_features)


# ---- CATEGORICAL / ONE-HOT ----
cat_pipeline = preprocessor.named_transformers_["onehot"]

onehot = cat_pipeline.named_steps["onehot"]

onehot_features = onehot.feature_names_in_
categories = onehot.categories_

print("\nONE-HOT FEATURES & CATEGORIES")
for f, cats in zip(onehot_features, categories):
    print(f"{f}: {cats}")
