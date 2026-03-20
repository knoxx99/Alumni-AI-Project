"""
alumni_extractor_v1.py
Extracts structured alumni info from raw unstructured text using regex patterns.
"""

import re


def extract_alumni_info(text: str) -> dict:
    """
    Given a raw alumni description string, extract:
    - name
    - email
    - phone
    - company
    - job_role
    - skills
    - graduation_year
    Returns a dict with all fields (empty string if not found).
    """

    info = {
        "name": "",
        "email": "",
        "phone": "",
        "company": "",
        "job_role": "",
        "skills": "",
        "graduation_year": None
    }

    # ── Email ──────────────────────────────────────────────────────────────
    email_pattern = r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'
    email_match = re.search(email_pattern, text)
    if email_match:
        info["email"] = email_match.group()

    # ── Phone ──────────────────────────────────────────────────────────────
    phone_pattern = r'(\+91[\-\s]?)?[6-9]\d{9}|(\+?\d[\d\s\-]{8,12}\d)'
    phone_match = re.search(phone_pattern, text)
    if phone_match:
        info["phone"] = re.sub(r'[\s\-]', '', phone_match.group()).strip()

    # ── Graduation Year ────────────────────────────────────────────────────
    grad_patterns = [
        r'(?:batch|graduated?|passout|class)\s+(?:of\s+)?(\d{4})',
        r'(\d{4})\s+(?:batch|graduate|passout|alumni)',
        r'(?:20|19)\d{2}'   # fallback: any 4-digit year
    ]
    for pattern in grad_patterns:
        year_match = re.search(pattern, text, re.IGNORECASE)
        if year_match:
            year = int(year_match.group(1) if year_match.lastindex else year_match.group())
            if 1970 <= year <= 2025:
                info["graduation_year"] = year
                break

    # ── Company ────────────────────────────────────────────────────────────
    company_patterns = [
        r'(?:at|@|with|in|for|working at|employed at|joined)\s+([A-Z][A-Za-z0-9\s&.,]+?)(?:\s+(?:as|in|and|,)|$)',
        r'([A-Z][A-Za-z0-9\s&]+(?:Inc|Ltd|LLC|Pvt|Technologies|Solutions|Systems|Group|Corp|Company)?)\s+(?:as|employee|team)',
    ]
    for pattern in company_patterns:
        company_match = re.search(pattern, text, re.IGNORECASE)
        if company_match:
            company = company_match.group(1).strip().rstrip(',.')
            if len(company) > 2 and company.lower() not in ['the', 'a', 'an']:
                info["company"] = company
                break

    # ── Job Role ───────────────────────────────────────────────────────────
    role_keywords = [
        "software engineer", "data scientist", "machine learning engineer",
        "product manager", "project manager", "business analyst",
        "full stack developer", "backend developer", "frontend developer",
        "devops engineer", "cloud architect", "cybersecurity analyst",
        "android developer", "ios developer", "data analyst",
        "research scientist", "professor", "lecturer", "teacher",
        "investment banker", "financial analyst", "chartered accountant",
        "portfolio manager", "bank manager", "insurance actuary",
        "management consultant", "operations manager", "hr manager",
        "marketing manager", "supply chain manager", "general manager",
        "ceo", "cto", "cfo", "founder", "co-founder", "entrepreneur",
        "startup founder", "researcher", "phd researcher", "scientist",
        "engineer", "developer", "analyst", "consultant", "manager",
        "director", "specialist", "associate", "coordinator", "intern"
    ]
    text_lower = text.lower()
    for role in role_keywords:
        if role in text_lower:
            # capitalize properly
            idx = text_lower.find(role)
            info["job_role"] = text[idx: idx + len(role)].title()
            break

    # ── Skills ─────────────────────────────────────────────────────────────
    skill_keywords = [
        "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
        "react", "angular", "vue", "node.js", "nodejs", "django", "flask",
        "spring boot", "kubernetes", "docker", "aws", "azure", "gcp",
        "machine learning", "deep learning", "nlp", "computer vision",
        "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
        "sql", "mysql", "postgresql", "mongodb", "redis", "kafka",
        "data analysis", "data science", "ai", "artificial intelligence",
        "blockchain", "cloud computing", "devops", "ci/cd", "git",
        "excel", "power bi", "tableau", "sap", "erp",
        "finance", "accounting", "auditing", "taxation",
        "research", "statistics", "matlab", "r programming",
        "leadership", "management", "agile", "scrum", "six sigma",
        "marketing", "seo", "digital marketing", "content strategy",
        "kotlin", "swift", "flutter", "react native",
        "penetration testing", "ethical hacking", "network security",
    ]
    found_skills = []
    for skill in skill_keywords:
        if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
            found_skills.append(skill.title())
    info["skills"] = ", ".join(found_skills) if found_skills else ""

    # ── Name ───────────────────────────────────────────────────────────────
    # Strategy: look for "Name: X", or leading proper noun phrase before verb
    name_label_match = re.search(r'(?:name\s*[:\-]\s*)([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,2})', text)
    if name_label_match:
        info["name"] = name_label_match.group(1).strip()
    else:
        # Leading proper noun (e.g., "Rahul Sharma is a...")
        leading_name = re.match(
            r'^([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,2})\s+(?:is|was|has|works|worked|currently)',
            text.strip()
        )
        if leading_name:
            info["name"] = leading_name.group(1).strip()
        else:
            # Fallback: first sequence of Title Case words
            title_case_match = re.search(r'([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,2})', text)
            if title_case_match:
                candidate = title_case_match.group(1).strip()
                # Reject if it looks like a company or role keyword
                if candidate.lower() not in [r.lower() for r in role_keywords]:
                    info["name"] = candidate

    return info
