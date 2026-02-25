function extractModelFeatures(rawText) {
  const features = {
    mother_age: null,
    height: null,
    weight_gain: null,

    pre_diabetes: null,
    gest_diabetes: null,
    pre_hyper: null,
    gest_hyper: null,
    eclampsia: null,
    prev_preterm: null,
    prev_csection: null,

    blood_glucose: null,
    hep_b: null,
    syphilis: null,
    chlamydia: null,
    hiv: null
  };

  if (!rawText) return features;

  const lines = rawText.split("\n");

  for (let line of lines) {
    const l = line.toLowerCase().trim();

    if (l.includes("age") && /\d+/.test(l)) {
      features.mother_age = extractNumber(l);
    }
    else if (l.includes("height")) {
      features.height = extractNumber(l);
    }
    else if (l.includes("weight gain")) {
      features.weight_gain = extractNumber(l);
    }
    else if (l.includes("pre-pregnancy diabetes")) {
      features.pre_diabetes = normalizeYesNo(l);
    }
    else if (l.includes("gestational diabetes")) {
      features.gest_diabetes = normalizeYesNo(l);
    }
    else if (l.includes("pre-pregnancy hypertension")) {
      features.pre_hyper = normalizeYesNo(l);
    }
    else if (l.includes("gestational hypertension")) {
      features.gest_hyper = normalizeYesNo(l);
    }
    else if (l.includes("eclampsia")) {
      features.eclampsia = normalizeYesNo(l);
    }
    else if (l.includes("previous preterm")) {
      features.prev_preterm = normalizeYesNo(l);
    }
    else if (l.includes("previous cesarean")) {
      features.prev_csection = normalizeYesNo(l);
    }
    else if (l.includes("blood glucose")) {
      features.blood_glucose = extractNumber(l);
    }
    else if (l.includes("hbsag")) {
      features.hep_b = normalizeYesNo(l);
    }
    else if (l.includes("syphilis")) {
      features.syphilis = normalizeYesNo(l);
    }
    else if (l.includes("chlamydia")) {
      features.chlamydia = normalizeYesNo(l);
    }
    else if (l.includes("hiv")) {
      features.hiv = normalizeYesNo(l);
    }
  }

  return features;
}

function extractNumber(text) {
  const match = text.match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function normalizeYesNo(text) {
  text = text.toLowerCase();

  if (text.includes("unknown") || text.includes("not known") || text.includes("n/a")) {
    return -1;
  }

  if (
    text.includes("no") ||
    text.includes("negative") ||
    text.includes("absent") ||
    text.includes("not detected")
  ) {
    return 0;
  }

  if (
    text.includes("yes") ||
    text.includes("positive") ||
    text.includes("present")
  ) {
    return 1;
  }

  return null;
}
