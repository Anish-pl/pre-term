function normalizeResult(text) {
  text = text.toLowerCase();

  if (text.includes("non-reactive") || text.includes("negative")) {
    return "No";
  }
  if (text.includes("reactive") || text.includes("positive")) {
    return "Yes";
  }
  return null;
}

export function extractModelFeatures(rawText) {
  const features = {
    hep_b: null,
    hep_c: null,
    syphilis: null,
    gonorrhea: null,
    chlamydia: null
  };

  const lines = rawText.split("\n");

  for (let line of lines) {
    const l = line.toLowerCase();

    if (l.includes("hbsag")) {
      features.hep_b = normalizeResult(l);
    }
    else if (l.includes("hcv") || l.includes("hepatitis c")) {
      features.hep_c = normalizeResult(l);
    }
    else if (l.includes("vdrl") || l.includes("rpr")) {
      features.syphilis = normalizeResult(l);
    }
    else if (l.includes("gonorrhea")) {
      features.gonorrhea = normalizeResult(l);
    }
    else if (l.includes("chlamydia")) {
      features.chlamydia = normalizeResult(l);
    }
  }

  return features;
}
