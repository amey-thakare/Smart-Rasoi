#!/usr/bin/env bash
# ====================================================================
# SMART RASOI — RUN CORE JAVA SYLLABUS DEMONSTRATION (UNITS 1 - 4)
# ====================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if ! command -v java &> /dev/null; then
    echo "⚠️  [PREREQUISITE] java command not found in PATH. Please install OpenJDK 17."
    exit 0
fi

if [ ! -d "${ROOT_DIR}/bin/com/smartrasoi" ]; then
    echo "Compiling Core module first..."
    "${SCRIPT_DIR}/compile.sh"
fi

echo "Executing Core Syllabus Demonstrations (Units 1 - 4)..."
java -cp "${ROOT_DIR}/bin" com.smartrasoi.CoreSyllabusRunner "$@"
