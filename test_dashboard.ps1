Write-Host "=============================================="
Write-Host "  TEST COMPLET - DASHBOARD POWER BI"
Write-Host "=============================================="
Write-Host ""
$BASE = "http://localhost:3000"

Function Get-Data($url, $label) {
    try { $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15 -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 200) { Write-Host "  $label : OK ($($r.Content.Length) octets)" -ForegroundColor Green; return $r.Content }
        else { Write-Host "  $label : HTTP $($r.StatusCode)" -ForegroundColor Red; return $null }
    } catch { Write-Host "  $label : ECHEC" -ForegroundColor Red; return $null }
}

# 1. VEHICULES
Write-Host "--- 1. VEHICULES ---" -ForegroundColor Cyan
$vRaw = Get-Data "$BASE/api/vehicles" "GET /api/vehicles"
if ($vRaw) {
    $v = $vRaw | ConvertFrom-Json
    Write-Host "  Total: $($v.total)"
    $actifs=0; $bloques=0; $kmTotal=0; $chaufCount=0
    foreach ($x in $v.vehicles) {
        $imm = if ($x.immatriculation) { $x.immatriculation } else { "-" }
        $ch = if ($x.chauffeurNom) { $x.chauffeurNom } else { "-" }
        $km = if ($x.kilometrage) { $x.kilometrage } else { 0 }
        $st = if ($x.statut) { $x.statut } else { "?" }
        Write-Host "    [$($x.id)] $imm | $($x.marque) $($x.modele) | $km km | $st | Ch: $ch"
        $kmTotal += $km
        if ($x.statut -eq "ACTIF") { $actifs++ }
        if ($x.statut -eq "BLOQUE" -or $x.statut -eq "IMMOBILISE") { $bloques++ }
        if ($x.chauffeurNom) { $chaufCount++ }
    }
    $txUtil = if ($v.total -gt 0) { [math]::Round(($actifs / $v.total) * 100) } else { 0 }
    Write-Host "  KPIs: Actifs=$actifs Bloqués=$bloques Km=$kmTotal TauxUtil=$txUtil% ChaufAssocies=$chaufCount/$($v.total)" -ForegroundColor Green
}
Write-Host ""

# 2. CHAUFFEURS
Write-Host "--- 2. CHAUFFEURS ---" -ForegroundColor Cyan
$uRaw = Get-Data "$BASE/users" "GET /users"
if ($uRaw) {
    $u = $uRaw | ConvertFrom-Json
    $chs = @()
    foreach ($x in $u) { if ($x.role -eq "CHAUFFEUR") { $chs += $x } }
    Write-Host "  Total chauffeurs: $($chs.Count)"
    foreach ($c in $chs) {
        Write-Host "    [$($c.id)] $($c.name) $($c.firstname) | $($c.personCode) | $($c.branchCode)"
    }
}
Write-Host ""

# 3. DECLARATIONS
Write-Host "--- 3. DECLARATIONS ---" -ForegroundColor Cyan
$dRaw = Get-Data "$BASE/api/declarations" "GET /api/declarations"
if ($dRaw) {
    $d = $dRaw | ConvertFrom-Json
    Write-Host "  Total: $($d.Count)"
    $parStatut = @{}; $parCrit = @{}; $parType = @{}; $parChauf = @{}
    $coutT=0; $resolues=0; $ouvertes=0; $critiques=0
    foreach ($x in $d) {
        $s = if ($x.statut) { $x.statut } else { "?" }
        $cr = if ($x.criticite) { $x.criticite } else { "?" }
        $tp = if ($x.typePanne) { $x.typePanne } else { "?" }
        $cn = if ($x.chauffeurNom) { $x.chauffeurNom } else { "?" }
        $ct = if ($x.coutProbleme) { $x.coutProbleme } else { 0 }
        if ($parStatut.ContainsKey($s)) { $parStatut[$s]++ } else { $parStatut[$s]=1 }
        if ($parCrit.ContainsKey($cr)) { $parCrit[$cr]++ } else { $parCrit[$cr]=1 }
        if ($parType.ContainsKey($tp)) { $parType[$tp]++ } else { $parType[$tp]=1 }
        if ($parChauf.ContainsKey($cn)) { $parChauf[$cn]++ } else { $parChauf[$cn]=1 }
        $coutT += $ct
        if ($s -eq "CLOTURE" -or $s -eq "RESOLU") { $resolues++ }
        if ($s -ne "CLOTURE" -and $s -ne "RESOLU" -and $s -ne "ANNULE" -and $s -ne "REJETEE") { $ouvertes++ }
        if ($cr -eq "CRITIQUE" -or $cr -eq "BLOQUANT") { $critiques++ }
    }
    $txReso = if ($d.Count -gt 0) { [math]::Round(($resolues / $d.Count) * 100) } else { 0 }
    Write-Host "  KPIs: Resolues=$resolues Ouvertes=$ouvertes Critiques=$critiques TauxReso=$txReso% CoutTotal=$coutT DH"
    Write-Host "  Par statut:"; foreach ($k in ($parStatut.GetEnumerator() | Sort-Object Value -Desc)) { Write-Host "    $($k.Key): $($k.Value)" }
    Write-Host "  Par criticite:"; foreach ($k in ($parCrit.GetEnumerator() | Sort-Object Value -Desc)) { Write-Host "    $($k.Key): $($k.Value)" }
    Write-Host "  Par type panne:"; foreach ($k in ($parType.GetEnumerator() | Sort-Object Value -Desc)) { Write-Host "    $($k.Key): $($k.Value)" }
    Write-Host "  Par chauffeur:"; foreach ($k in ($parChauf.GetEnumerator() | Sort-Object Value -Desc)) { Write-Host "    $($k.Key): $($k.Value)" }
}
Write-Host ""

# 4. INTERVENTIONS
Write-Host "--- 4. INTERVENTIONS ---" -ForegroundColor Cyan
$iRaw = Get-Data "$BASE/api/powerbi/stats-interventions" "GET /api/powerbi/stats-interventions"
if ($iRaw) {
    $i = $iRaw | ConvertFrom-Json
    Write-Host "  Total: $($i.interventions.Count) | DureeMoy=$($i.dureeMoyenneH)h | DureeMax=$($i.dureeMaxH)h"
    $term=0; $encours=0
    foreach ($x in $i.interventions) {
        $p = if ($x.prestataire) { $x.prestataire } else { "-" }
        Write-Host "    [$($x.id)] $($x.vehiculeImmatriculation) | $($x.typePanne) | $($x.statut) | $($x.duree)h | $($x.cout) DH | $p"
        if ($x.statut -eq "TERMINEE" -or $x.statut -eq "CLOTURE") { $term++ }
        if ($x.statut -eq "EN_COURS" -or $x.statut -eq "OUVERT") { $encours++ }
    }
    Write-Host "  KPIs: Terminees=$term EnCours=$encours"
}
Write-Host ""

# 5. BUDGET
Write-Host "--- 5. BUDGET ---" -ForegroundColor Cyan
$bRaw = Get-Data "$BASE/api/powerbi/budget-analysis" "GET /api/powerbi/budget-analysis"
if ($bRaw) {
    $b = $bRaw | ConvertFrom-Json
    Write-Host "  Mois: $($b.Count)"
    foreach ($x in $b) { Write-Host "    $($x.mois) | Budget=$($x.budget) | Cout=$($x.cout) | Ecart=$($x.ecart)" }
}
$abRaw = Get-Data "$BASE/api/budget/active" "GET /api/budget/active"
if ($abRaw) {
    $ab = $abRaw | ConvertFrom-Json; Write-Host "  Actif: Budget=$($ab.budgetTotal) Utilise=$($ab.budgetUtilise) Restant=$($ab.budgetRestant)"
}
Write-Host ""

# 6. CROISEMENT CHAUFFEURS vs DECLARATIONS
Write-Host "--- 6. CROISEMENT CHAUFFEURS vs DONNEES ---" -ForegroundColor Cyan
if ($chs -and $d) {
    foreach ($c in $chs) {
        $nom = "$($c.name) $($c.firstname)"
        $dCount=0; $dRes=0; $coutC=0; $vehs=@()
        foreach ($x in $d) {
            if ($x.chauffeurNom -eq $nom -or $x.chauffeurId -eq $c.id) { 
                $dCount++
                if ($x.statut -eq "CLOTURE" -or $x.statut -eq "RESOLU") { $dRes++ }
                $coutC += if ($x.coutProbleme) { $x.coutProbleme } else { 0 }
            }
        }
        foreach ($v in $v.vehicles) { if ($v.chauffeurNom -eq $nom -or $v.chauffeurId -eq $c.id) { $vehs += $v.immatriculation } }
        $tx = if ($dCount -gt 0) { [math]::Round(($dRes / $dCount) * 100) } else { 100 }
        Write-Host "  $nom : $dCount decs ($dRes resolues) | $tx% taux | $coutC DH | $($vehs.Count) vehicules"
    }
}

# 7. IA INSIGHTS
Write-Host "--- 7. IA INSIGHTS ---" -ForegroundColor Cyan
$aiRaw = Get-Data "$BASE/api/powerbi/v2/ai-insights" "GET /api/powerbi/v2/ai-insights"
if ($aiRaw) {
    $ai = $aiRaw | ConvertFrom-Json
    Write-Host "  Declarations: Total=$($ai.declarations.total) Tendance=$($ai.declarations.tendance) TauxReso=$($ai.declarations.tauxResolutionRecent)%"
    Write-Host "  Checkups: Total=$($ai.checkups.total) TauxConf=$($ai.checkups.tauxConformite)% Tendance=$($ai.checkups.tendance)"
}
Write-Host ""
Write-Host "=============================================="
Write-Host "  TEST TERMINE"
Write-Host "=============================================="