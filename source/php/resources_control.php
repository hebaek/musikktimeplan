<?php

$clean['control'] = (isset($_POST['control']) ? filter_input(INPUT_POST, 'control') : null);

if ($clean['control'] == 'setbruker') { set_bruker(); exit(); };
if ($clean['control'] == 'setrolle')  { set_rolle();  exit(); };



function set_bruker() {
    $clean = Array();
    if (isset($_POST['bruker'])) {
        $clean['brukerrid']  = filter_input(INPUT_POST, 'bruker');
        $clean['riddata']    = getdatafromrid($clean['brukerrid']);
        $clean['brukernavn'] = $clean['riddata']['data'];

        if ($_SESSION['eier']->getDelegatOK($clean['brukernavn'])) {
            unset($_SESSION['bruker']);
            unset($_SESSION['rolle']);
    
            $_SESSION['bruker'] = new Bruker($clean['brukernavn']);
            $_SESSION['rolle']  = 'Lærer';
        } else {
            error_log('getDelegatOK er false for eier ' . $_SESSION['eier']->getBrukernavn() . ' og bruker ' . $clean['brukernavn']);
        }
    }
    exit();
}



function set_rolle() {
    $clean['rolle'] = (isset($_POST['role']) ? filter_input(INPUT_POST, 'role') : null);
    if ($clean['rolle'] == null) { exit(); }

    return send_modulvalg($clean['rolle']);
}



function send_modulvalg($rolle = null) {
    error_log($rolle);
    if ($rolle == null) { exit(); }

    $result = '';
    $moduler = $_SESSION['bruker']->getmodules($rolle);

    foreach ($moduler as $modul) {
        $status = '';
        if ($modul['Status'] == 'Alfa') $status = 'alpha';
        if ($modul['Status'] == 'Beta') $status = 'beta';

        switch($modul['Modul']) {
            case 'Oppsamling':
                $result .= "<div class='module' id='module_oppsamling'>";
                $result .= "    <div class='head {$status}'>Oppsamlingsprøver</div>";
                $result .= "    <div class='details'>";
                $result .= "        <ol>";
                $result .= "            <li class='{$status}'>Meld på elever</li>";
                $result .= "            <li class='{$status}'>Vis prøver</li>";
                $result .= "            <li class='{$status}'>Oversikt</li>";
                $result .= "        </ol>";
                $result .= "    </div>";
                $result .= "</div>";
                break;
    
            case 'Strykvarsler':
                $result .= "<div class='module'>";
                $result .= "    <div class='head {$status}'>Strykvarsler</div>";
                $result .= "    <div class='details'>";
                $result .= "        <ol>";
                $result .= "            <li class='{$status}'>Sett varsler</li>";
                $result .= "            <li class='{$status}'>Oversikt</li>";
                $result .= "        </ol>";
                $result .= "    </div>";
                $result .= "</div>";
                break;

            case 'Utskrifter':
                $result .= "<div class='module active' id='module_utskrifter'>";
                $result .= "    <div class='head {$status}'>Utskrifter</div>";
                $result .= "</div>";
                break;
        }
    }

    echo $result;
    exit();
}



?>