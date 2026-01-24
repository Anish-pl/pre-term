import numpy as np
import pandas as pd
from typing import Dict, List, Tuple

class PreTermRecommendationEngine:
    """
    Analyzes patient data to identify risk factors and generate personalized recommendations.
    This demonstrates domain knowledge application beyond simple prediction.
    """
    
    def __init__(self):
        # Define feature categories with clinical significance
        self.feature_categories = {
            "lifestyle": {
                "features": ["cig0_r", "cig1_r", "cig2_r", "cig3_r", "bmi", "wtgain"],
                "weight": 0.25
            },
            "prenatal_care": {
                "features": ["precare5", "previs_rec"],
                "weight": 0.20
            },
            "medical_history": {
                "features": ["rf_pdiab", "rf_gdiab", "rf_phype", "rf_ghype", 
                           "rf_ehype", "rf_ppterm", "rf_cesar"],
                "weight": 0.30
            },
            "reproductive_history": {
                "features": ["priorlive", "priordead", "priorterm", "illb_r", 
                           "tbo_rec", "dplural"],
                "weight": 0.15
            },
            "infections": {
                "features": ["ip_gon", "ip_syph", "ip_chlam", "ip_hepb", "ip_hepc"],
                "weight": 0.10
            }
        }
        
        # Clinical thresholds based on research
        self.risk_thresholds = {
            "cig0_r": {"safe": 0, "warning": 1, "danger": 2},
            "cig1_r": {"safe": 0, "warning": 1, "danger": 2},
            "bmi": {"low": 18.5, "healthy_min": 18.5, "healthy_max": 24.9, "high": 30},
            "wtgain": {"low": 15, "healthy_min": 25, "healthy_max": 35, "high": 45},
            "precare5": {"optimal": 1, "acceptable": 2, "late": 3},
            "previs_rec": {"minimal": 4, "adequate": 7, "optimal": 10},
            "mager": {"young": 20, "optimal_min": 20, "optimal_max": 35, "advanced": 35}
        }

    def analyze_patient(self, patient_data: Dict, prediction_proba: float) -> Dict:
        """
        Main analysis function that generates comprehensive recommendations.
        
        Args:
            patient_data: Dictionary of patient features
            prediction_proba: Probability of preterm birth from model
            
        Returns:
            Complete analysis with risk breakdown and recommendations
        """
        # Calculate category-wise risk scores
        category_scores = self._calculate_category_scores(patient_data)
        
        # Identify modifiable risk factors
        modifiable_risks = self._identify_modifiable_risks(patient_data)
        
        # Generate personalized recommendations
        recommendations = self._generate_recommendations(patient_data, modifiable_risks)
        
        # Create risk timeline
        risk_timeline = self._create_risk_timeline(patient_data)
        
        # Calculate overall risk level
        risk_level = self._determine_risk_level(prediction_proba, category_scores)
        
        return {
            "overall_risk": {
                "level": risk_level,
                "probability": round(prediction_proba * 100, 1),
                "category": "High Risk" if prediction_proba > 0.5 else "Low Risk"
            },
            "category_analysis": category_scores,
            "modifiable_factors": modifiable_risks,
            "recommendations": recommendations,
            "risk_timeline": risk_timeline,
            "priority_actions": self._get_priority_actions(recommendations)
        }

    def _calculate_category_scores(self, data: Dict) -> Dict:
        """Calculate risk contribution for each category"""
        category_results = {}
        
        for category, config in self.feature_categories.items():
            features = config["features"]
            weight = config["weight"]
            
            # Count risk factors in this category
            risk_count = 0
            total_features = 0
            risk_details = []
            
            for feature in features:
                if feature in data and data[feature] is not None:
                    total_features += 1
                    is_risk, severity = self._assess_feature_risk(feature, data[feature])
                    
                    if is_risk:
                        risk_count += severity
                        risk_details.append({
                            "feature": self._get_feature_name(feature),
                            "value": data[feature],
                            "severity": severity,
                            "impact": "High" if severity >= 2 else "Moderate"
                        })
            
            # Calculate normalized score (0-100)
            if total_features > 0:
                score = min(100, (risk_count / total_features) * 100 * weight * 4)
            else:
                score = 0
            
            category_results[category] = {
                "score": round(score, 1),
                "risk_factors_count": len(risk_details),
                "details": risk_details,
                "status": self._get_category_status(score)
            }
        
        return category_results

    def _assess_feature_risk(self, feature: str, value) -> Tuple[bool, int]:
        """Assess if a feature value indicates risk and its severity"""
        
        # Smoking assessment
        if feature.startswith("cig"):
            if isinstance(value, (int, float)) and value > 0:
                return True, min(3, int(value))
            return False, 0
        
        # BMI assessment
        if feature == "bmi" and value is not None:
            try:
                bmi = float(value)
                if bmi < 18.5 or bmi > 30:
                    return True, 2 if (bmi < 17 or bmi > 35) else 1
            except:
                pass
            return False, 0
        
        # Weight gain assessment
        if feature == "wtgain" and value is not None:
            try:
                gain = float(value)
                if gain < 15 or gain > 45:
                    return True, 2 if (gain < 10 or gain > 50) else 1
            except:
                pass
            return False, 0
        
        # Prenatal care timing
        if feature == "precare5":
            if value in [3, 4]:  # Late or no care
                return True, 3 if value == 4 else 2
            return False, 0
        
        # Prenatal visits
        if feature == "previs_rec":
            if isinstance(value, (int, float)) and value < 7:
                return True, 2 if value < 4 else 1
            return False, 0
        
        # Medical conditions (Y/N/U format)
        if feature.startswith("rf_") or feature.startswith("ip_"):
            if value == "Y":
                return True, 2
            return False, 0
        
        # Age assessment
        if feature == "mager":
            try:
                age = int(value)
                if age < 18 or age > 40:
                    return True, 2 if (age < 16 or age > 45) else 1
            except:
                pass
            return False, 0
        
        return False, 0

    def _identify_modifiable_risks(self, data: Dict) -> List[Dict]:
        """Identify risk factors that patient can modify"""
        modifiable = []
        
        # Smoking
        smoking_features = ["cig1_r", "cig2_r", "cig3_r"]
        for feat in smoking_features:
            if feat in data and data[feat] and data[feat] > 0:
                modifiable.append({
                    "factor": "Smoking",
                    "current_status": f"Active smoker (Level {data[feat]})",
                    "modifiable": True,
                    "priority": "Critical",
                    "potential_impact": "High - Can reduce risk by 30-40%"
                })
                break
        
        # BMI
        if "bmi" in data and data["bmi"]:
            try:
                bmi = float(data["bmi"])
                if bmi < 18.5:
                    modifiable.append({
                        "factor": "Low Body Weight",
                        "current_status": f"BMI {bmi:.1f} (Underweight)",
                        "modifiable": True,
                        "priority": "High",
                        "potential_impact": "Moderate - Healthy weight reduces risk"
                    })
                elif bmi > 30:
                    modifiable.append({
                        "factor": "High Body Weight",
                        "current_status": f"BMI {bmi:.1f} (Obese)",
                        "modifiable": True,
                        "priority": "High",
                        "potential_impact": "Moderate - Weight management helps"
                    })
            except:
                pass
        
        # Prenatal care
        if data.get("precare5", 0) > 2:
            modifiable.append({
                "factor": "Late Prenatal Care",
                "current_status": "Care started late in pregnancy",
                "modifiable": True,
                "priority": "Critical",
                "potential_impact": "High - Early care is crucial"
            })
        
        if data.get("previs_rec", 0) < 7:
            modifiable.append({
                "factor": "Insufficient Prenatal Visits",
                "current_status": f"Only {data.get('previs_rec', 0)} visits scheduled/completed",
                "modifiable": True,
                "priority": "High",
                "potential_impact": "Moderate - Regular monitoring important"
            })
        
        return modifiable

    def _generate_recommendations(self, data: Dict, modifiable_risks: List[Dict]) -> List[Dict]:
        """Generate actionable recommendations based on risk factors"""
        recommendations = []
        
        # Smoking cessation
        if any(r["factor"] == "Smoking" for r in modifiable_risks):
            recommendations.append({
                "category": "Lifestyle - Smoking",
                "priority": "Critical",
                "action": "Immediate Smoking Cessation",
                "details": [
                    "Consult healthcare provider about smoking cessation programs",
                    "Consider nicotine replacement therapy (with doctor approval)",
                    "Join support groups for pregnant women quitting smoking",
                    "Avoid secondhand smoke exposure"
                ],
                "expected_benefit": "Can reduce preterm birth risk by 30-40%",
                "timeline": "Start immediately"
            })
        
        # Weight management
        bmi_risk = next((r for r in modifiable_risks if "Weight" in r["factor"]), None)
        if bmi_risk:
            if "Low" in bmi_risk["factor"]:
                recommendations.append({
                    "category": "Nutrition - Weight Gain",
                    "priority": "High",
                    "action": "Nutritional Support for Healthy Weight Gain",
                    "details": [
                        "Consult nutritionist for high-calorie, nutrient-dense meal plan",
                        "Eat small, frequent meals (5-6 times daily)",
                        "Include protein-rich foods, healthy fats, and complex carbs",
                        "Consider prenatal nutrition supplements"
                    ],
                    "expected_benefit": "Reduces risk of low birth weight and preterm birth",
                    "timeline": "Start this week"
                })
            else:
                recommendations.append({
                    "category": "Nutrition - Weight Management",
                    "priority": "High",
                    "action": "Healthy Weight Management During Pregnancy",
                    "details": [
                        "Work with nutritionist on balanced meal plan",
                        "Focus on nutrient-dense, lower-calorie foods",
                        "Light exercise as approved by doctor (walking, prenatal yoga)",
                        "Monitor blood sugar if gestational diabetes risk"
                    ],
                    "expected_benefit": "Reduces complications and preterm birth risk",
                    "timeline": "Start this week"
                })
        
        # Prenatal care optimization
        if data.get("precare5", 0) > 2 or data.get("previs_rec", 0) < 7:
            recommendations.append({
                "category": "Prenatal Care",
                "priority": "Critical",
                "action": "Optimize Prenatal Care Schedule",
                "details": [
                    "Schedule all remaining prenatal appointments immediately",
                    "Don't miss any scheduled appointments",
                    "Discuss any concerns or symptoms with provider",
                    "Follow all screening test recommendations"
                ],
                "expected_benefit": "Early detection and management of complications",
                "timeline": "Schedule within 48 hours"
            })
        
        # Medical condition management
        medical_conditions = []
        for key in ["rf_pdiab", "rf_gdiab", "rf_phype", "rf_ghype"]:
            if data.get(key) == "Y":
                medical_conditions.append(key)
        
        if medical_conditions:
            recommendations.append({
                "category": "Medical Management",
                "priority": "Critical",
                "action": "Strict Medical Condition Monitoring",
                "details": [
                    "Take all prescribed medications as directed",
                    "Monitor blood pressure/glucose at home as recommended",
                    "Keep detailed log of symptoms",
                    "Report any unusual symptoms immediately",
                    "Attend all specialist appointments"
                ],
                "expected_benefit": "Prevents complications leading to preterm birth",
                "timeline": "Ongoing - daily monitoring"
            })
        
        # Previous preterm history
        if data.get("rf_ppterm") == "Y":
            recommendations.append({
                "category": "High-Risk Monitoring",
                "priority": "Critical",
                "action": "Enhanced Monitoring for Previous Preterm History",
                "details": [
                    "Discuss progesterone therapy with doctor (proven to reduce repeat preterm)",
                    "More frequent cervical length monitoring",
                    "Watch for signs of preterm labor (contractions, pelvic pressure)",
                    "Consider reduced activity or bed rest if recommended"
                ],
                "expected_benefit": "Can reduce recurrence risk by 30-50%",
                "timeline": "Discuss at next appointment"
            })
        
        # General wellness
        recommendations.append({
            "category": "General Wellness",
            "priority": "Moderate",
            "action": "Maintain Overall Pregnancy Health",
            "details": [
                "Stay hydrated (8-10 glasses of water daily)",
                "Get adequate rest (7-9 hours sleep)",
                "Manage stress through relaxation techniques",
                "Avoid harmful substances (alcohol, drugs)",
                "Practice good oral hygiene (dental health affects pregnancy)"
            ],
            "expected_benefit": "Supports overall pregnancy health",
            "timeline": "Ongoing daily habits"
        })
        
        return recommendations

    def _create_risk_timeline(self, data: Dict) -> Dict:
        """Create timeline of risk factors across pregnancy"""
        timeline = {
            "pre_pregnancy": [],
            "first_trimester": [],
            "second_trimester": [],
            "third_trimester": [],
            "ongoing": []
        }
        
        # Pre-pregnancy factors
        if data.get("rf_pdiab") == "Y":
            timeline["pre_pregnancy"].append("Pre-existing diabetes")
        if data.get("rf_phype") == "Y":
            timeline["pre_pregnancy"].append("Pre-existing hypertension")
        if data.get("cig0_r", 0) > 0:
            timeline["pre_pregnancy"].append("Smoking before pregnancy")
        
        # First trimester
        if data.get("precare5", 0) > 1:
            timeline["first_trimester"].append("Late prenatal care initiation")
        if data.get("cig1_r", 0) > 0:
            timeline["first_trimester"].append("Continued smoking")
        
        # Second trimester
        if data.get("cig2_r", 0) > 0:
            timeline["second_trimester"].append("Continued smoking")
        if data.get("rf_gdiab") == "Y":
            timeline["second_trimester"].append("Gestational diabetes diagnosed")
        
        # Third trimester
        if data.get("cig3_r", 0) > 0:
            timeline["third_trimester"].append("Continued smoking")
        if data.get("rf_ghype") == "Y":
            timeline["third_trimester"].append("Gestational hypertension")
        
        # Ongoing
        if data.get("rf_ppterm") == "Y":
            timeline["ongoing"].append("History of preterm birth")
        if data.get("dplural", 1) == 2:
            timeline["ongoing"].append("Multiple pregnancy")
        
        return timeline

    def _get_priority_actions(self, recommendations: List[Dict]) -> List[str]:
        """Extract top 3 priority actions"""
        critical = [r for r in recommendations if r["priority"] == "Critical"]
        high = [r for r in recommendations if r["priority"] == "High"]
        
        priority_actions = []
        for rec in (critical + high)[:3]:
            priority_actions.append(f"{rec['action']} - {rec['timeline']}")
        
        return priority_actions

    def _determine_risk_level(self, proba: float, category_scores: Dict) -> str:
        """Determine overall risk level descriptor"""
        if proba > 0.7:
            return "Very High Risk"
        elif proba > 0.5:
            return "High Risk"
        elif proba > 0.3:
            return "Moderate Risk"
        else:
            return "Low Risk"

    def _get_category_status(self, score: float) -> str:
        """Get status label for category score"""
        if score > 60:
            return "High Concern"
        elif score > 30:
            return "Moderate Concern"
        else:
            return "Low Concern"

    def _get_feature_name(self, feature: str) -> str:
        """Convert feature code to readable name"""
        name_map = {
            "cig0_r": "Smoking before pregnancy",
            "cig1_r": "Smoking 1st trimester",
            "cig2_r": "Smoking 2nd trimester",
            "cig3_r": "Smoking 3rd trimester",
            "bmi": "Body Mass Index",
            "wtgain": "Weight gain",
            "precare5": "Prenatal care timing",
            "previs_rec": "Prenatal visits",
            "rf_pdiab": "Pre-pregnancy diabetes",
            "rf_gdiab": "Gestational diabetes",
            "rf_phype": "Pre-pregnancy hypertension",
            "rf_ghype": "Gestational hypertension",
            "rf_ehype": "Eclampsia",
            "rf_ppterm": "Previous preterm birth",
            "rf_cesar": "Previous C-section",
            "ip_gon": "Gonorrhea",
            "ip_syph": "Syphilis",
            "ip_chlam": "Chlamydia",
            "ip_hepb": "Hepatitis B",
            "ip_hepc": "Hepatitis C",
            "mager": "Mother's age",
            "dplural": "Multiple pregnancy"
        }
        return name_map.get(feature, feature)