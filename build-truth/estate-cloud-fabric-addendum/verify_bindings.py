from __future__ import annotations

import csv
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BINDINGS = ROOT / "repository-provider-bindings.csv"
EXPECTED_REPOSITORIES = 78
ALLOWED_RENDER_MODES = {"direct-service", "shared-fabric"}
ALLOWED_VERCEL_MODES = {"direct-git-project", "shared-surface"}
ALLOWED_NEON_PROJECTS = {
    "ghost-atlas-estate-registry",
    "ghost-atlas-trifinity",
    "atlas-mind-commercial",
    "atlas-mind-command-center",
}

with BINDINGS.open(newline="", encoding="utf-8") as handle:
    rows = list(csv.DictReader(handle))

repositories = [row["repository"] for row in rows]
assert len(rows) == EXPECTED_REPOSITORIES, (len(rows), EXPECTED_REPOSITORIES)
assert len(set(repositories)) == EXPECTED_REPOSITORIES, "duplicate repository binding"
assert all(repo.startswith("Atlas-Ascend/") for repo in repositories)
assert all(row["coverage"] == "ENROLLED" for row in rows)
assert all(row["canonical_gateway_repo"] for row in rows)
assert all(row["render_mode"] in ALLOWED_RENDER_MODES for row in rows)
assert all(row["render_target"] for row in rows)
assert all(row["vercel_mode"] in ALLOWED_VERCEL_MODES for row in rows)
assert all(row["vercel_target"] for row in rows)
assert all(row["neon_project"] in ALLOWED_NEON_PROJECTS for row in rows)

fabric_counts = Counter(row["fabric"] for row in rows)
render_counts = Counter(row["render_mode"] for row in rows)
vercel_counts = Counter(row["vercel_mode"] for row in rows)
neon_counts = Counter(row["neon_project"] for row in rows)

print("ESTATE_CLOUD_FABRIC_BINDING=PASS")
print(f"GITHUB={len(rows)}/{EXPECTED_REPOSITORIES}")
print(f"UNIQUE_REPOSITORIES={len(set(repositories))}")
print(f"FABRICS={len(fabric_counts)}")
print(f"RENDER={dict(render_counts)}")
print(f"VERCEL={dict(vercel_counts)}")
print(f"NEON={dict(neon_counts)}")
print("OMITTED=0")
