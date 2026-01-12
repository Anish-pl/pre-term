export function extractModelFeatures(rawText) {
  const features = {
    // Demographics
    mother_age: null,
    height: null,
    weight_gain: null,

    // Medical
    pre_diabetes: null,
    gest_diabetes: null,
    pre_hyper: null,
    gest_hyper: null,
    eclampsia: null,
    prev_preterm: null,
    prev_csection: null,

    // Labs / infections
    blood_glucose: null,
    hep_b: null,
    syphilis: null,
    chlamydia: null,
    hiv: null
  };

  const lines = rawText.split("\n");

  for (let line of lines) {
    const l = line.toLowerCase();

    // -------------------------
    // AGE
    // -------------------------
    if (l.includes("age") && l.includes("years")) {
      features.mother_age = extractNumber(l);
    }

    // -------------------------
    // HEIGHT
    // -------------------------
    else if (l.includes("height")) {
      // works for: 63 inches (159 cm)
      features.height = extractNumber(l);
    }

    // -------------------------
    // WEIGHT GAIN
    // -------------------------
    else if (l.includes("weight gain")) {
      features.weight_gain = extractNumber(l);
    }

    // -------------------------
    // DIABETES
    // -------------------------
    else if (l.includes("pre-pregnancy diabetes")) {
      features.pre_diabetes = normalizeYesNo(l);
    }
    else if (l.includes("gestational diabetes")) {
      features.gest_diabetes = normalizeYesNo(l);
    }

    // -------------------------
    // HYPERTENSION
    // -------------------------
    else if (l.includes("pre-pregnancy hypertension")) {
      features.pre_hyper = normalizeYesNo(l);
    }
    else if (l.includes("gestational hypertension")) {
      features.gest_hyper = normalizeYesNo(l);
    }

    // -------------------------
    // ECLAMPSIA
    // -------------------------
    else if (l.includes("eclampsia")) {
      features.eclampsia = normalizeYesNo(l);
    }

    // -------------------------
    // OB HISTORY
    // -------------------------
    else if (l.includes("previous preterm")) {
      features.prev_preterm = normalizeYesNo(l);
    }
    else if (l.includes("previous cesarean")) {
      features.prev_csection = normalizeYesNo(l);
    }

    // -------------------------
    // LAB TESTS
    // -------------------------
    else if (l.includes("blood glucose")) {
      features.blood_glucose = extractNumber(l);
    }
    else if (l.includes("hbsag")) {
      features.hep_b = normalizeYesNo(l);
    }
    else if (l.includes("vdrl") || l.includes("syphilis")) {
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
  if (text.includes("yes") || text.includes("positive") || text.includes("present")) {
    return 1;
  }
  if (text.includes("no") || text.includes("negative") || text.includes("absent")) {
    return 0;
  }
  return null;
}
