Write-Host "========================================================================"
Write-Host "  TEST MULTI-TRANSACTIONS & FILTRES - DASHBOARD POWER BI"
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "========================================================================"
Write-Host ""
$BASE = "http://localhost:3000"

function Get-Data($url, $label) {
    try { $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20 -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 200) { return ($r.Content | ConvertFrom-Json) }
        else { Write-Host "  $label : HTTP $($r.StatusCode)" -ForegroundColor Red; return $null }
    } catch { return $null }
}

function SafeNum($v, $d=0) { $n = [double]($v -as [double]); return if ($n -is [double] -and !([double]::IsNaN($n))) { $n } else { $d } }

# ======================================================================
# SECTION 1: RÉCUPÉRATION DE TOUTES LES DONNÉES (comme dashboard.service.ts)
# ======================================================================
Write-Host "=== SECTION 1: DONNÉES BRUTES ===" -ForegroundColor Cyan

$vehiclesRaw = Get-Data "$BASE/api/vehicles" "vehicles"
$users = Get-Data "$BASE/users" "users"
$declarations = Get-Data "$BASE/api/declarations" "declarations"
$interventionsRaw = Get-Data "$BASE/api/powerbi/stats-interventions" "interventions"
$budgetAnalysis = Get-Data "$BASE/api/powerbi/budget-analysis" "budget-analysis"
$activeBudget = Get-Data "$BASE/api/budget/active" "active"
$docStats = Get-Data "$BASE/api/fleet/kpi/documents-stats" "documents"
$indicateurs = Get-Data "$BASE/api/powerbi/indicateurs" "indicateurs"
$aiInsights = Get-Data "$BASE/api/powerbi/v2/ai-insights" "ai-insights"

$vehicles = if ($vehiclesRaw) { $vehiclesRaw.vehicles } else { @() }
$interventions = if ($interventionsRaw) { $interventionsRaw.interventions } else { @() }
$budget = if ($budgetAnalysis) { $budgetAnalysis } else { @() }

Write-Host "  Toutes les API OK" -ForegroundColor Green
Write-Host ""

# ======================================================================
# SECTION 2: INTÉGRITÉ DES DONNÉES
# ======================================================================
Write-Host "=== SECTION 2: INTÉGRITÉ ===" -ForegroundColor Cyan

$errors = 0
if ($vehicles) {
    foreach ($v in $vehicles) {
        if ($v.id -eq $null) { Write-Host "  ERREUR: Véhicule sans ID"; $errors++ }
        if ($v.immatriculation -eq $null -and $v.marque -eq $null) {
            Write-Host ("  WARN: Vehicule #$($v.id) sans immatriculation ni marque") -ForegroundColor Yellow
        }
    }
}
# Check duplicate immatriculations
$immas = @{}; $dupCount = 0
if ($vehicles) {
    foreach ($v in $vehicles) {
        if ($v.immatriculation) {
            if ($immas.ContainsKey($v.immatriculation)) { $immas[$v.immatriculation]++ } else { $immas[$v.immatriculation] = 1 }
        }
    }
    foreach ($k in $immas.Keys) { if ($immas[$k] -gt 1) { Write-Host "  DUPLICATE: $k ($($immas[$k]) fois)" -ForegroundColor Yellow; $dupCount++ } }
}

if ($declarations) {
    foreach ($d in $declarations) {
        if ($d.idIncident -eq $null -and $d.id -eq $null) { Write-Host "  ERREUR: Déclaration sans ID"; $errors++ }
    }
}

if ($errors -eq 0) { Write-Host "  Intégrité OK" -ForegroundColor Green }
Write-Host "  Duplicatas immatriculation: $dupCount"
Write-Host ""

# ======================================================================
# SECTION 3: CROISEMENT DES DONNÉES (Data Integrity Cross-Reference)
# ======================================================================
Write-Host "=== SECTION 3: CROISEMENTS ===" -ForegroundColor Cyan

# 3a. Déclarations liées à des véhicules existants
if ($declarations -and $vehicles) {
    $validImmas = @{}; foreach ($v in $vehicles) { if ($v.immatriculation) { $validImmas[$v.immatriculation]=$true } }
    $orphanDecs = 0
    foreach ($d in $declarations) {
        $vImm = $d.vehiculeImmatriculation
        if ($vImm -and !$validImmas.ContainsKey($vImm)) { $orphanDecs++ }
    }
    Write-Host "  Déclarations orphelines (véhicule introuvable): $orphanDecs"
}

# 3b. Chauffeurs et leurs véhicules
Write-Host "  --- Chauffeurs vs Véhicules vs Déclarations ---" -ForegroundColor Yellow
$chauffeurs = @($users | Where-Object { $_.role -eq "CHAUFFEUR" })
foreach ($c in $chauffeurs) {
    $nom = "$($c.name) $($c.firstname)"
    $vMatch = @($vehicles | Where-Object { $_.chauffeurNom -eq $nom })
    $dMatch = @($declarations | Where-Object { $_.chauffeurNom -eq $nom -or $_.chauffeurId -eq $c.id })
    Write-Host "  $nom : $($vMatch.Count) véhicules, $($dMatch.Count) déclarations"
}

# 3c. Budget vs déclarations (coût total)
if ($budget -and $declarations) {
    $budgetCout = 0; foreach ($b in $budget) { $budgetCout += SafeNum $b.cout }
    $declCout = 0; foreach ($d in $declarations) { $declCout += SafeNum $d.coutProbleme }
    Write-Host ("  Coût budget: $([math]::Round($budgetCout,2)) DH | Coût déclarations: $([math]::Round($declCout,2)) DH") -ForegroundColor Yellow
}

# 3d. Véhicules sans déclaration
if ($vehicles -and $declarations) {
    $decImmas = @{}; foreach ($d in $declarations) { if ($d.vehiculeImmatriculation) { $decImmas[$d.vehiculeImmatriculation]=$true } }
    $sansDec = @($vehicles | Where-Object { $_.immatriculation -and !$decImmas.ContainsKey($_.immatriculation) })
    Write-Host "  Véhicules sans déclaration: $($sansDec.Count)"
}

Write-Host ""

# ======================================================================
# SECTION 4: CALCULS KPIs (réplication de buildKPIs)
# ======================================================================
Write-Host "=== SECTION 4: KPIs CALCULÉS ===" -ForegroundColor Cyan

if ($vehicles -and $declarations) {
    $totalV = $vehicles.Length
    $actifs = 0; $bloques = 0; $maint = 0; $kmTotal = 0
    foreach ($v in $vehicles) {
        $s = $v.statut
        if ($s -eq "ACTIF") { $actifs++ }
        elseif ($s -eq "BLOQUE" -or $s -eq "IMMOBILISE") { $bloques++ }
        elseif ($s -eq "MAINTENANCE") { $maint++ }
        $kmTotal += SafeNum $v.kilometrage
    }
    $dispos = $totalV - $bloques
    $txUtil = if ($totalV -gt 0) { [math]::Round(($actifs / $totalV) * 100) } else { 0 }
    $txDispo = if ($totalV -gt 0) { [math]::Round(($dispos / $totalV) * 100) } else { 0 }
    
    # Déclarations
    $totalDecs = $declarations.Length
    $resolues = 0; $ouvertes = 0; $critiques = 0
    foreach ($d in $declarations) {
        $s = $d.statut
        if ($s -eq "CLOTURE" -or $s -eq "RESOLU") { $resolues++ }
        elseif ($s -ne "ANNULE" -and $s -ne "REJETEE") { $ouvertes++ }
        if ($d.criticite -eq "CRITIQUE" -or $d.criticite -eq "BLOQUANT") { $critiques++ }
    }
    $txReso = if ($totalDecs -gt 0) { [math]::Round(($resolues / $totalDecs) * 100) } else { 0 }
    $coutTotalDecs = 0; foreach ($d in $declarations) { $coutTotalDecs += SafeNum $d.coutProbleme }
    
    # Interventions
    $totalInts = $interventions.Length
    $intTerminees = 0; $intEnCours = 0
    foreach ($i in $interventions) {
        $s = $i.statut
        if ($s -eq "TERMINEE" -or $s -eq "CLOTURE") { $intTerminees++ }
        if ($s -eq "EN_COURS" -or $s -eq "OUVERT") { $intEnCours++ }
    }
    $coutTotalInt = 0; foreach ($i in $interventions) { $coutTotalInt += SafeNum $i.cout }
    
    Write-Host "  VÉHICULES:" -ForegroundColor Green
    Write-Host "    Total=$totalV Actifs=$actifs Bloqués=$bloques Maintenance=$maint Disponibles=$dispos"
    Write-Host "    TauxUtilisation=$txUtil% TauxDisponibilité=$txDispo% KmTotal=$kmTotal km"
    Write-Host ""
    Write-Host "  DÉCLARATIONS:" -ForegroundColor Green
    Write-Host "    Total=$totalDecs Résolues=$resolues Ouvertes=$ouvertes Critiques=$critiques"
    Write-Host "    TauxRésolution=$txReso% CoûtTotal=$([math]::Round($coutTotalDecs,2)) DH"
    Write-Host "    CoûtMoyen=$([math]::Round(($coutTotalDecs / [math]::Max($totalDecs,1)), 2)) DH"
    Write-Host ""
    Write-Host "  INTERVENTIONS:" -ForegroundColor Green
    Write-Host "    Total=$totalInts Terminées=$intTerminees EnCours=$intEnCours"
    Write-Host "    CoûtTotal=$([math]::Round($coutTotalInt,2)) DH"
    Write-Host ""
    
    # Prestataires
    $prestaSet = @{}; foreach ($i in $interventions) { if ($i.prestataire) { $prestaSet[$i.prestataire]=$true } }
    Write-Host "  Prestataires distincts: $($prestaSet.Count)"
    Write-Host ""
}

# ======================================================================
# SECTION 5: FILTRES - DONNÉES PAR DIMENSION
# ======================================================================
Write-Host "=== SECTION 5: FILTRES MULTI-DIMENSIONS ===" -ForegroundColor Cyan

# 5a. Par statut de véhicule
Write-Host "--- 5a. Par Statut Véhicule ---" -ForegroundColor Yellow
if ($vehicles) {
    $parStatutV = @{}
    foreach ($v in $vehicles) {
        $s = if ($v.statut) { $v.statut } else { "INCONNU" }
        if ($parStatutV.ContainsKey($s)) { $parStatutV[$s]++ } else { $parStatutV[$s]=1 }
    }
    foreach ($k in ($parStatutV.Keys | Sort-Object)) {
        Write-Host ("  $k : $($parStatutV[$k]) véhicules")
    }
}

# 5b. Par criticité de déclaration
Write-Host "--- 5b. Par Criticité ---" -ForegroundColor Yellow
if ($declarations) {
    $parCrit = @{}
    foreach ($d in $declarations) {
        $c = if ($d.criticite) { $d.criticite } else { "INCONNU" }
        if ($parCrit.ContainsKey($c)) { $parCrit[$c]++ } else { $parCrit[$c]=1 }
    }
    foreach ($k in ($parCrit.Keys | Sort-Object)) {
        Write-Host ("  $k : $($parCrit[$k]) déclarations")
    }
}

# 5c. Par type de panne
Write-Host "--- 5c. Par Type de Panne ---" -ForegroundColor Yellow
if ($declarations) {
    $parType = @{};
    $coutParType = @{}
    foreach ($d in $declarations) {
        $t = if ($d.typePanne) { $d.typePanne } else { "INCONNU" }
        if ($parType.ContainsKey($t)) { $parType[$t]++ } else { $parType[$t]=1 }
        $ct = SafeNum $d.coutProbleme
        if ($coutParType.ContainsKey($t)) { $coutParType[$t] += $ct } else { $coutParType[$t] = $ct }
    }
    foreach ($k in ($parType.Keys | Sort-Object)) {
        Write-Host ("  $k : $($parType[$k]) décl., $([math]::Round($coutParType[$k],2)) DH")
    }
}

# 5d. Par chauffeur (nom)
Write-Host "--- 5d. Par Chauffeur ---" -ForegroundColor Yellow
if ($declarations) {
    $parChauf = @{}; $coutParChauf = @{}; $resoParChauf = @{}
    foreach ($d in $declarations) {
        $n = if ($d.chauffeurNom) { $d.chauffeurNom } else { "INCONNU" }
        if ($parChauf.ContainsKey($n)) { $parChauf[$n]++ } else { $parChauf[$n]=1 }
        $ct = SafeNum $d.coutProbleme
        if ($coutParChauf.ContainsKey($n)) { $coutParChauf[$n] += $ct } else { $coutParChauf[$n] = $ct }
        if ($d.statut -eq "CLOTURE" -or $d.statut -eq "RESOLU") {
            if ($resoParChauf.ContainsKey($n)) { $resoParChauf[$n]++ } else { $resoParChauf[$n]=1 }
        } else {
            if (!$resoParChauf.ContainsKey($n)) { $resoParChauf[$n]=0 }
        }
    }
    foreach ($k in ($parChauf.Keys | Sort-Object)) {
        $total = $parChauf[$k]
        $reso = if ($resoParChauf.ContainsKey($k)) { $resoParChauf[$k] } else { 0 }
        $tx = if ($total -gt 0) { [math]::Round(($reso / $total) * 100) } else { 0 }
        Write-Host ("  $k : $total décl. ($reso résolues, ${tx}%) | $([math]::Round($coutParChauf[$k],2)) DH")
    }
}

# 5e. Par mois
Write-Host "--- 5e. Par Mois ---" -ForegroundColor Yellow
if ($declarations) {
    $parMois = @{}; $coutMois = @{}
    foreach ($d in $declarations) {
        if ($d.dateHeure) {
            $dStr = "$($d.dateHeure)"
            $mois = $dStr.Substring(0, 7)
        } else { $mois = "INCONNU" }
        if ($parMois.ContainsKey($mois)) { $parMois[$mois]++ } else { $parMois[$mois]=1 }
        $ct = SafeNum $d.coutProbleme
        if ($coutMois.ContainsKey($mois)) { $coutMois[$mois] += $ct } else { $coutMois[$mois] = $ct }
    }
    foreach ($k in ($parMois.Keys | Sort-Object)) {
        Write-Host ("  $k : $($parMois[$k]) décl., $([math]::Round($coutMois[$k],2)) DH")
    }
}

# 5f. Par statut de déclaration
Write-Host "--- 5f. Par Statut Déclaration ---" -ForegroundColor Yellow
if ($declarations) {
    $parStatutD = @{}
    foreach ($d in $declarations) {
        $s = if ($d.statut) { $d.statut } else { "INCONNU" }
        if ($parStatutD.ContainsKey($s)) { $parStatutD[$s]++ } else { $parStatutD[$s]=1 }
    }
    foreach ($k in ($parStatutD.Keys | Sort-Object)) {
        Write-Host ("  $k : $($parStatutD[$k]) déclarations")
    }
}

# 5g. Par véhicule
Write-Host "--- 5g. Par Véhicule (top déclarations) ---" -ForegroundColor Yellow
if ($vehicles -and $declarations) {
    $parVehicule = @{}; $coutParVeh = @{}
    foreach ($d in $declarations) {
        $v = $d.vehiculeImmatriculation
        if (-not $v) { $v = "NON_AFFECTE" }
        if ($parVehicule.ContainsKey($v)) { $parVehicule[$v]++ } else { $parVehicule[$v]=1 }
        $ct = SafeNum $d.coutProbleme
        if ($coutParVeh.ContainsKey($v)) { $coutParVeh[$v] += $ct } else { $coutParVeh[$v] = $ct }
    }
    Write-Host ("Top 5 par nombre de déclarations:") -ForegroundColor Yellow
    $i = 0
    foreach ($k in ($parVehicule.Keys | Sort-Object { $parVehicule[$_] } -Descending)) {
        if ($i -ge 5) { break }
        Write-Host ("  $k : $($parVehicule[$k]) décl., $([math]::Round($coutParVeh[$k],2)) DH")
        $i++
    }
}

# 5h. Par agence / site
Write-Host "--- 5h. Par Agence/Site ---" -ForegroundColor Yellow
if ($vehicles) {
    $parAgence = @{}
    foreach ($v in $vehicles) {
        $a = if ($v.agence) { $v.agence } else { "INCONNUE" }
        if ($parAgence.ContainsKey($a)) { $parAgence[$a]++ } else { $parAgence[$a]=1 }
    }
    foreach ($k in ($parAgence.Keys | Sort-Object)) {
        Write-Host ("  $k : $($parAgence[$k]) véhicules")
    }
}

# 5i. Par prestataire (interventions)
Write-Host "--- 5i. Par Prestataire ---" -ForegroundColor Yellow
if ($interventions) {
    $parPresta = @{}; $coutPresta = @{}
    foreach ($i in $interventions) {
        $p = if ($i.prestataire) { $i.prestataire } else { "INCONNU" }
        if ($parPresta.ContainsKey($p)) { $parPresta[$p]++ } else { $parPresta[$p]=1 }
        $ct = SafeNum $i.cout
        if ($coutPresta.ContainsKey($p)) { $coutPresta[$p] += $ct } else { $coutPresta[$p] = $ct }
    }
    foreach ($k in ($parPresta.Keys | Sort-Object)) {
        Write-Host ("  $k : $($parPresta[$k]) int., $([math]::Round($coutPresta[$k],2)) DH")
    }
}

# 5j. Par région (branchCode)
Write-Host "--- 5j. Par Région ---" -ForegroundColor Yellow
if ($users) {
    $parRegion = @{}
    foreach ($u in $users) {
        $r = if ($u.branchCode) { $u.branchCode } else { "INCONNU" }
        if ($parRegion.ContainsKey($r)) { $parRegion[$r]++ } else { $parRegion[$r]=1 }
    }
    foreach ($k in ($parRegion.Keys | Sort-Object)) { Write-Host ("  $k : $($parRegion[$k]) utilisateurs") }
}

Write-Host ""

# ======================================================================
# SECTION 6: SCORES CHAUFFEURS (réplication de buildDrivers)
# ======================================================================
Write-Host "=== SECTION 6: SCORES CHAUFFEURS ===" -ForegroundColor Cyan

$chauffeurs = @($users | Where-Object { $_.role -eq "CHAUFFEUR" })
if ($chauffeurs) {
    Write-Host "  Note: Formule = Conf(40%) + Reso(40%) + BonusCritique(20%)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host ("  " + "-" * 120) -ForegroundColor DarkGray
    Write-Host ("  {0,-20} {1,8} {2,8} {3,8} {4,10} {5,8} {6,8} {7,10} {8,12} {9,10}" -f "Chauffeur","Anomalies","Résolues","TauxReso%","CoûtTotal","Véhic.","Ints.","TauxConf%","Score","Villes") -ForegroundColor Yellow
    Write-Host ("  " + "-" * 120) -ForegroundColor DarkGray
    
    foreach ($c in $chauffeurs) {
        $nom = "$($c.name) $($c.firstname)"
        $uid = SafeNum $c.id
        $personCode = $c.personCode
        
        $vList = @($vehicles | Where-Object { $_.chauffeurNom -eq $nom })
        $dList = @($declarations | Where-Object {
            $dId = SafeNum $_.chauffeurId
            ($dId -eq $uid) -or (($_.chauffeurNom -or "") -eq $nom) -or (($_.chauffeurMatricule -or "") -eq $personCode)
        })
        $iList = @($interventions | Where-Object { (($_.chauffeurNom -or "") -eq $nom) })
        
        $totalDecs = $dList.Length
        $resolved = @($dList | Where-Object { $_.statut -eq "CLOTURE" -or $_.statut -eq "RESOLU" }).Length
        $critiques = @($dList | Where-Object { $_.criticite -eq "CRITIQUE" -or $_.criticite -eq "BLOQUANT" }).Length
        
        # Checkups non disponibles, taux conf par défaut = 100
        $tauxConf = 100
        $tauxReso = if ($totalDecs -gt 0) { [math]::Round(($resolved / $totalDecs) * 100) } else { 100 }
        $score = [math]::Round($tauxConf * 0.4 + $tauxReso * 0.4 + (if ($critiques -eq 0) { 20 } else { [math]::Max(0, 20 - $critiques * 5) }))
        
        $coutC = 0; foreach ($d in $dList) { $coutC += SafeNum $d.coutProbleme }
        $ville = $c.branchCode
        if (-not $ville) { $ville = $c.ville }
        
        Write-Host ("  {0,-20} {1,8} {2,8} {3,8} {4,10:n2} {5,8} {6,8} {7,10} {8,10} {9,10}" -f $nom.Substring(0,[math]::Min(20,$nom.Length)),$totalDecs,$resolved,$tauxReso,$coutC,$vList.Length,$iList.Length,$tauxConf,$score,$ville)
    }
    Write-Host ("  " + "-" * 120) -ForegroundColor DarkGray
}

Write-Host ""

# ======================================================================
# SECTION 7: COMPARAISON BUDGET vs RÉEL
# ======================================================================
Write-Host "=== SECTION 7: BUDGET vs RÉEL ===" -ForegroundColor Cyan
if ($budget) {
    Write-Host ("  {0,-10} {1,15} {2,15} {3,15} {4,15}" -f "Mois","Budget","Coût","Écart","Utilisation") -ForegroundColor Yellow
    Write-Host ("  " + "-" * 70) -ForegroundColor DarkGray
    $budgetTotal=0; $coutTotalB=0
    foreach ($b in ($budget | Sort-Object mois)) {
        $budgetTotal += SafeNum $b.budget
        $coutTotalB += SafeNum $b.cout
        $ecart = SafeNum $b.cout - SafeNum $b.budget
        $tx = if ((SafeNum $b.budget) -gt 0) { [math]::Round((SafeNum $b.cout / (SafeNum $b.budget)) * 100) } else { 0 }
        Write-Host ("  {0,-10} {1,15:n2} {2,15:n2} {3,15:n2} {4,14}%" -f $b.mois, (SafeNum $b.budget), (SafeNum $b.cout), $ecart, $tx)
    }
    Write-Host ("  " + "-" * 70) -ForegroundColor DarkGray
    Write-Host ("  {0,-10} {1,15:n2} {2,15:n2}" -f "TOTAL",$budgetTotal,$coutTotalB) -ForegroundColor Green
}

Write-Host ""

# ======================================================================
# SECTION 8: SCORES PAR VÉHICULE (pour chaque véhicule)
# ======================================================================
Write-Host "=== SECTION 8: SCORES VÉHICULES ===" -ForegroundColor Cyan
if ($vehicles) {
    Write-Host ("  {0,-5} {1,-15} {2,-20} {3,10} {4,10} {5,10} {6,10}" -f "ID","Immatric.","Marque Modèle","Km","Statut","Déclar.","Coût") -ForegroundColor Yellow
    Write-Host ("  " + "-" * 85) -ForegroundColor DarkGray
    foreach ($v in $vehicles) {
        $imm = if ($v.immatriculation) { $v.immatriculation } else { "#$($v.id)" }
        $marque = if ($v.marque) { $v.marque } else { "?" }
        $modele = if ($v.modele) { $v.modele } else { "?" }
        $statut = if ($v.statut) { $v.statut } else { "?" }
        $km = SafeNum $v.kilometrage
        
        # Compter déclarations pour ce véhicule
        $decV = 0; $coutV = 0
        foreach ($d in $declarations) {
            if ($d.vehiculeImmatriculation -and $v.immatriculation -and $d.vehiculeImmatriculation -eq $v.immatriculation) {
                $decV++
                $coutV += SafeNum $d.coutProbleme
            }
        }
        
        Write-Host ("  {0,-5} {1,-15} {2,-20} {3,10:n0} {4,10} {5,10} {6,10:n0}" -f $v.id,$imm,("$marque $modele").Substring(0,[math]::Min(20,("$marque $modele").Length)),$km,$statut,$decV,$coutV)
    }
    Write-Host ("  " + "-" * 85) -ForegroundColor DarkGray
}

Write-Host ""

# ======================================================================
# SECTION 9: INDICATEURS COMPARATIFS (dashboard frontend vs réalité)
# ======================================================================
Write-Host "=== SECTION 9: COMPARATIF FRONTEND vs RÉALITÉ ===" -ForegroundColor Cyan

if ($indicateurs) {
    Write-Host "  --- Indicateurs endpoint vs calculs locaux ---" -ForegroundColor Yellow
    Write-Host ("  {0,-35} {1,15} {2,15}" -f "Métrique","API","Local") -ForegroundColor Yellow
    Write-Host ("  " + "-" * 65) -ForegroundColor DarkGray
    Write-Host ("  {0,-35} {1,15} {2,15}" -f "Total véhicules",("<value>"),$totalV)
    Write-Host ("  {0,-35} {1,15} {2,15}" -f "Taux utilisation",("<value>"),"${txUtil}%")
    Write-Host ("  {0,-35} {1,15} {2,15}" -f "Taux résolution",("<value>"),"${txReso}%")
    Write-Host ""
}

# ======================================================================
# SECTION 10: RÉSUMÉ COMPARATIF POUR TABLEAU DE BORD
# ======================================================================
Write-Host "=== SECTION 10: RÉSUMÉ COMPARATIF ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ======== INDICATEURS CLÉS ========" -ForegroundColor Green
Write-Host ("  {0,-30} {1,15}" -f "Indicateur","Valeur")
Write-Host ("  " + "-" * 45)
Write-Host ("  {0,-30} {1,15}" -f "Parc total",$totalV)
Write-Host ("  {0,-30} {1,15}" -f "Véhicules actifs",$actifs)
Write-Host ("  {0,-30} {1,15}" -f "Taux d'utilisation","${txUtil}%")
Write-Host ("  {0,-30} {1,15}" -f "Taux de disponibilité","${txDispo}%")
Write-Host ("  {0,-30} {1,15}" -f "Déclarations totales",$totalDecs)
Write-Host ("  {0,-30} {1,15}" -f "Déclarations résolues",$resolues)
Write-Host ("  {0,-30} {1,15}" -f "Déclarations ouvertes",$ouvertes)
Write-Host ("  {0,-30} {1,15}" -f "Déclarations critiques",$critiques)
Write-Host ("  {0,-30} {1,15}" -f "Taux de résolution","${txReso}%")
Write-Host ("  {0,-30} {1,15:n2}" -f "Coût total déclar.",$coutTotalDecs)
Write-Host ("  {0,-30} {1,15}" -f "Interventions totales",$totalInts)
Write-Host ("  {0,-30} {1,15}" -f "Interventions terminées",$intTerminees)
Write-Host ("  {0,-30} {1,15}" -f "Chauffeurs actifs",$chauffeurs.Length)
Write-Host ("  {0,-30} {1,15}" -f "Km total parc","$kmTotal km")
Write-Host ""

Write-Host "  ======== COMPARATIF CHAUFFEURS ========" -ForegroundColor Green
Write-Host ("  {0,-20} {1,10} {2,10} {3,10} {4,10} {5,12} {6,10}" -f "Chauffeur","Decs","Resolues","Taux%","Critiques","Coût DH","Score")
Write-Host ("  " + "-" * 85)
foreach ($c in $chauffeurs) {
    $nom = "$($c.name) $($c.firstname)"
    $uid = SafeNum $c.id
    $personCode = $c.personCode
    $dList = @($declarations | Where-Object {
        $dId = SafeNum $_.chauffeurId
        ($dId -eq $uid) -or (($_.chauffeurNom -or "") -eq $nom) -or (($_.chauffeurMatricule -or "") -eq $personCode)
    })
    $totalDecs = $dList.Length
    $resolved = @($dList | Where-Object { $_.statut -eq "CLOTURE" -or $_.statut -eq "RESOLU" }).Length
    $critiques = @($dList | Where-Object { $_.criticite -eq "CRITIQUE" -or $_.criticite -eq "BLOQUANT" }).Length
    $tauxReso = if ($totalDecs -gt 0) { [math]::Round(($resolved / $totalDecs) * 100) } else { 100 }
    $coutC = 0; foreach ($d in $dList) { $coutC += SafeNum $d.coutProbleme }
    $tauxConf = 100
    $score = [math]::Round($tauxConf * 0.4 + $tauxReso * 0.4 + (if ($critiques -eq 0) { 20 } else { [math]::Max(0, 20 - $critiques * 5) }))
    Write-Host ("  {0,-20} {1,10} {2,10} {3,10} {4,10} {5,12:n0} {6,10}" -f $nom.Substring(0,[math]::Min(20,$nom.Length)),$totalDecs,$resolved,$tauxReso,$critiques,$coutC,$score)
}

Write-Host ""
Write-Host "  ======== RÉPARTITION PAR TYPE PANNE ========" -ForegroundColor Green
Write-Host ("  {0,-20} {1,10} {2,15}" -f "Type panne","Nb décl.","Coût total")
Write-Host ("  " + "-" * 45)
foreach ($k in ($parType.Keys | Sort-Object)) {
    Write-Host ("  {0,-20} {1,10} {2,15:n0}" -f $k,$parType[$k],$coutParType[$k])
}

Write-Host ""
Write-Host "  ======== RÉPARTITION PAR MOIS ========" -ForegroundColor Green
Write-Host ("  {0,-10} {1,10} {2,15}" -f "Mois","Nb décl.","Coût total")
Write-Host ("  " + "-" * 35)
foreach ($k in ($parMois.Keys | Sort-Object)) {
    Write-Host ("  {0,-10} {1,10} {2,15:n0}" -f $k,$parMois[$k],$coutMois[$k])
}

Write-Host ""
Write-Host "========================================================================"
Write-Host "  TEST TERMINÉ"
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "========================================================================"
