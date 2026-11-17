#!/bin/bash
# Ugentlig bootstrap (soendag 03:00): sccd er kun stoppet mens der pakkes; test + udgivelse sker med sccd koerende
set -u
cd /root/explorer
T0=$(date +%s)
echo "=== $(date -Is) start"
systemctl stop sccd
for i in $(seq 1 60); do pgrep -x sccd >/dev/null || break; sleep 2; done
if pgrep -x sccd >/dev/null; then echo "sccd stoppede ikke - afbryder"; systemctl start sccd; exit 1; fi
T1=$(date +%s)
/usr/bin/node scripts/create_bootstrap.js build; RC=$?
systemctl start sccd
T2=$(date +%s)
echo "--- sccd nede i $((T2-T1))s (stop tog $((T1-T0))s)"
if [ $RC -eq 0 ]; then
  /usr/bin/node scripts/create_bootstrap.js finalize; RC=$?
fi
echo "=== $(date -Is) slut rc=$RC (total $(( $(date +%s)-T0 ))s)"
exit $RC
