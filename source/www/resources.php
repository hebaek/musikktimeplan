<?php
    $version = 'obs-1.0'; // Get this from DB, do not expose in $_SESSION!

    $clean = Array();
    $clean['file'] = filter_input(INPUT_GET, 'file');

    $info = pathinfo($clean['file']);

    if (in_array($info['extension'], array('html', 'css', 'js', 'svg'))) {
        switch ($info['extension']) {
            case 'html': $folder = '/';    $mimetype = 'text/html';       break;
            case 'css':  $folder = 'css/'; $mimetype = 'text/css';        break;
            case 'js':   $folder = 'js/';  $mimetype = 'text/javascript'; break;
            case 'svg':  $folder = 'img/'; $mimetype = 'image/svg+xml';   break;
        }
        
        $realfile = '../versions/' . $version . '/' . $folder . $info['basename'];
 
        header('Content-Type: ' . $mimetype);
        header('Content-Disposition: inline; filename="' . $info['basename'] . '"');
        header('Content-Length: ' . filesize($realfile));

        readfile($realfile);
    }
?>