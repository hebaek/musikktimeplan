<?php



/*!
    @class DB
    @abstract A class representing a database connection
    @discussion
        A class representing a database connection. It wraps connection details.
    @attributelist Tests
        None
    @updated 2013-08-22
*/
class DB {
//    private $dsn = 'mysql:host=889684.db.tornado-node.net;dbname=mysql889684;charset=UTF8';
    private $dsn = 'mysql:dbname=mysql889684;host=889684.db.tornado-node.net';
    private $db  = null;

    
    /*!
        @abstract Get a handle to the database
        @returns database handle
        @attributelist Tests
            None
        @updated 2013-06-11
    */
    public function getdb() {
        try {
            $this->db = new PDO($this->dsn, 'mysql889684', 'tOUs&ZTZ0Fw4U@d?Q7mv!UBq#BHRMIeT');
        } catch (PDOException $e) {
            error_log("Error!: " . $e->getMessage());
        }
        
        return $this->db;
    }


    /*!
        @abstract Close the database connection
        @returns database handle
        @attributelist Tests
            None
        @updated 2013-08-22
    */
    public function closedb() {
        $this->db = null;
    }
}



/*!
    @class User
    @abstract A class representing a user
    @discussion
        A class representing a user. It handles querying the database for information.
    @updated 2022-12-08
*/
class User {
    protected $username;
    protected $userid;
    protected $firstname;
    protected $middlename;
    protected $lastname;

    function __construct($username) {
        try {
            $dbc = new DB();
            $db = $dbc->getdb();

            $db_query = $db->prepare("SELECT `UserID`, `Firstname`, `Middlename`, `Lastname` FROM `User` LEFT JOIN `Person` USING (`PersonID`) WHERE `Username` = :username");
            $db_query->execute(array(':username' => $username));
            $data = $db_query->fetch();

            if ($data and count($data) == 8) {
                $this->username     = $username;
                $this->userid       = $data['UserID'];
                $this->firstname    = $data['Firstname'];
                $this->middlename   = $data['Middlename'];
                $this->lastname     = $data['Lastname'];
            } else {
                throw new Exception('No such user');
            }
        } catch(Exception $e) {
            error_log('User::__construct(' . $username . '): Caught exception: ' . $e->getMessage());
            throw $e;
        }
    }

    public function authenticate($password) {
        return password_verify($password, $this->passwordhash);
    }
}




/*!
    @class Eier
    @abstract A class representing the owner of a session
    @discussion
        A class representing the owner of a session. It handles querying the database for user rights.
    @updated 2013-06-20
*/
class Eier {
    protected $rid;
    protected $Brukernavn;
    protected $BrukerID;
    protected $Fornavn;
    protected $Mellomnavn;
    protected $Etternavn;
    protected $Displaynavn;
    protected $Foto;

    public function getrid()         { return $this->rid; }
    public function getBrukernavn()  { return $this->Brukernavn; }
    public function getDisplaynavn() { return $this->Displaynavn; }
    public function getFoto()        { return $this->Foto; }

    function __construct($brukernavn) {
        try {
            $dbc = new DB();
            $db = $dbc->getdb();
            
            $db_query = $db->prepare("SELECT `BrukerID`, `Fornavn`, `Mellomnavn`, `Etternavn`, `Tiltalenavn` FROM `Bruker` LEFT JOIN `Person` USING (`PersonID`) WHERE `Brukernavn` = :brukernavn");
            $db_query->execute(array(':brukernavn' => $brukernavn));
            $data = $db_query->fetch();

            if (count($data) == 10) {
                $this->Brukernavn  = $brukernavn;
                $this->BrukerID    = $data['BrukerID'];
                $this->Fornavn     = $data['Fornavn'];
                $this->Mellomnavn  = $data['Mellomnavn'];
                $this->Etternavn   = $data['Etternavn'];
                $this->Tiltalenavn = $data['Tiltalenavn'];

                $this->Displaynavn = composename('FulltFornavn', $this->Fornavn, $this->Mellomnavn, $this->Etternavn, $this->Tiltalenavn);

                $this->rid = getrid('Brukernavn', $this->Brukernavn);
            } else {
                throw new Exception('No such user');
            }

            $db_query = $db->prepare('SELECT `Filnavn` FROM `PersonFoto` JOIN `Bruker` USING (`PersonID`) WHERE `BrukerID` = :brukerid ORDER BY `Dato` DESC LIMIT 1');
            $db_query->execute(array(':brukerid' => $this->BrukerID));
            $data = $db_query->fetch(PDO::FETCH_BOTH);

            if ($data) {
                $this->Foto = $data['Filnavn'];
                getrid('Foto', $this->Foto);
            }
        } catch(Exception $e) {
            error_log('Eier::__construct(' . $brukernavn . '): Caught exception: ' . $e->getMessage());
            throw $e;
        }
    }

    public function getBruker($delegatbrukernavn = null) {
        if ($delegatbrukernavn == null) {
            return new Bruker($this->Brukernavn);
        } else {
            try {
                $dbc = new DB();
                $db = $dbc->getdb();
    
                $db_query = $db->prepare("SELECT `DelegatBrukernavn` FROM `BrukerDelegater` WHERE `BrukerID` = :brukerid AND `DelegatBrukernavn` = :delegatbrukernavn");
                $db_query->execute(array(':brukerid' => $this->BrukerID, ':delegatbrukernavn' => $delegatbrukernavn));
                $data = $db_query->fetch(PDO::FETCH_BOTH);
                
                if ($data) {
                    return new Bruker($data['DelegatBrukernavn']);
                } else {
                    throw new Exception('No such user');
                }
            } catch(Exception $e) {
                error_log('Eier::getBruker(' . $delegatbrukernavn . '): Caught exception: ' . $e->getMessage());
            }
        }
    }

    public function getBrukerListe() {
        $result = array();

        try {
            $dbc = new DB();
            $db = $dbc->getdb();

            $db_query = $db->prepare("SELECT `DelegatBrukernavn`, `Fornavn`, `Mellomnavn`, `Etternavn`, `Tiltalenavn` FROM `BrukerDelegater` WHERE `BrukerID` = :brukerid");
            $db_query->execute(array(':brukerid' => $this->BrukerID));
            $db_query->setFetchMode(PDO::FETCH_BOTH);
            
            foreach ($db_query as $user) {
                $result[$user['DelegatBrukernavn']] = composename('KortFornavn', $user['Fornavn'], $user['Mellomnavn'], $user['Etternavn'], $user['Tiltalenavn']);
            }

            $collator = new Collator('nb_NO');
            $collator->asort($result);
            
            return $result;
        } catch(Exception $e) {
            error_log('Eier::getBrukerListe: Caught exception: ' . $e->getMessage());
        }
    }

    public function getDelegatRoller($delegatbrukernavn) {
        $result = array();

        if ($delegatbrukernavn == $this->Brukernavn) {
            try {
                $dbc = new DB();
                $db = $dbc->getdb();

                $db_query = $db->prepare("SELECT `RolleID`, `Tittel` FROM `BrukerRoller` WHERE `BrukerID` = :brukerid");
                $db_query->execute(array(':brukerid' => $this->BrukerID));
                $db_query->setFetchMode(PDO::FETCH_BOTH);

                foreach ($db_query as $rolle) {
                    $result[$rolle['RolleID']] = $rolle['Tittel'];
                }
            } catch(Exception $e) {
                error_log('Eier::getDelegatRoller(' . $this->Brukernavn . '): Caught exception: ' . $e->getMessage());
            }
        } else {
            try {
                $dbc = new DB();
                $db = $dbc->getdb();

                $db_query = $db->prepare("SELECT `DelegatRolleID`, `DelegatTittel` FROM `BrukerDelegater` WHERE `BrukerID` = :brukerid AND `DelegatBrukernavn` = :delegatbrukernavn");
                $db_query->execute(array(':brukerid' => $this->BrukerID, ':delegatbrukernavn' => $delegatbrukernavn));
                $db_query->setFetchMode(PDO::FETCH_BOTH);

                foreach ($db_query as $rolle) {
                    $result[$rolle['DelegatRolleID']] = $rolle['DelegatTittel'];
                }
            } catch(Exception $e) {
                error_log('Eier::getDelegatRoller(' . $delegatbrukernavn . '): Caught exception: ' . $e->getMessage());
            }
        }
 
        $collator = new Collator('nb_NO');
        $collator->asort($result);
        return $result;
   }
   
   public function getDelegatOK($delegatbrukernavn) {
        if ($delegatbrukernavn == $this->Brukernavn) { return true; }

        try {
            $dbc = new DB();
            $db = $dbc->getdb();

            $db_query = $db->prepare("SELECT `DelegatBrukernavn` FROM `BrukerDelegater` WHERE `BrukerID` = :brukerid");
            $db_query->execute(array(':brukerid' => $this->BrukerID));
            $db_query->setFetchMode(PDO::FETCH_BOTH);

            foreach ($db_query as $user) {
                if ($user['DelegatBrukernavn'] == $delegatbrukernavn) { return true; }
            }
        } catch(Exception $e) {
            error_log('Bruker::getDelegatOK(' . $delegatbrukernavn . '): Caught exception: ' . $e->getMessage());
        }

        return false;
   }
}



/*!
    @class Person
    @abstract A class representing a person. It handles querying the database for information.
    @discussion
        A class representing a person. It handles querying the database for information.
    @updated 2013-06-10
*/
class Person {
    public    $rid;
    protected $age;
    protected $PersonID;
    protected $BrukerID;
    protected $Brukernavn;
    protected $Fornavn;
    protected $Mellomnavn;
    protected $Etternavn;
    protected $NavnKortFornavn;
    protected $NavnKortEtternavn;
    protected $Foto;

    function __construct($cBrukernavn, $cPersonID = null) {
        $this->Brukernavn = $cBrukernavn;
        $this->PersonID   = $cPersonID;
        $this->update();
    }

    public function getNavnKortFornavn()    { $this->update(); return $this->NavnKortFornavn; }
    public function getBrukernavn()         { $this->update(); return $this->Brukernavn;      }
    public function getPersonID()           { $this->update(); return $this->PersonID;        }
    public function getFoto()               { $this->update(); return $this->Foto;            }

    protected function update($mode = false) {
        if (time() < $this->age + 5*60 && $mode != 'force') { return; }

        try {
            $dbc = new DB();
            $db = $dbc->getdb();

            if ($this->PersonID == null) {
                $db_query = $db->prepare('SELECT `BrukerID`, `PersonID` FROM `Bruker` WHERE `Brukernavn` = :brukernavn');
                $db_query->execute(array(':brukernavn' => $this->Brukernavn));
                $data = $db_query->fetch(PDO::FETCH_BOTH);
                
                if ($data) {
                    $this->BrukerID = $data['BrukerID'];
                    $this->PersonID = $data['PersonID'];
                }
            }

            $db_query = $db->prepare('SELECT `Brukernavn`, `Fornavn`, `Mellomnavn`, `Etternavn`, `Tiltalenavn` FROM `Bruker` LEFT JOIN `Person` USING (`PersonID`) WHERE `PersonID` = :personid');
            $db_query->execute(array(':personid' => $this->PersonID));
            $data = $db_query->fetch(PDO::FETCH_BOTH);

            if ($data) {
                $this->Brukernavn        = $data['Brukernavn'];
                $this->Fornavn           = $data['Fornavn'];
                $this->Mellomnavn        = $data['Mellomnavn'];
                $this->Etternavn         = $data['Etternavn'];
                $this->Tiltalenavn       = $data['Tiltalenavn'];
                
                $this->NavnKortFornavn   = $this->Fornavn   . ' '  . $this->Etternavn;
                $this->NavnKortEtternavn = $this->Etternavn . ', ' . $this->Fornavn;

                $this->age               = time();
            }

            $db_query = $db->prepare('SELECT `Filnavn` FROM `PersonFoto` WHERE `PersonID` = :personid ORDER BY `Dato` DESC LIMIT 1');
            $db_query->execute(array(':personid' => $this->PersonID));
            $data = $db_query->fetch(PDO::FETCH_BOTH);

            if ($data) {
                $this->Foto = $data['Filnavn'];
            }
        } catch(Exception $e) {
            error_log('Person::update: Caught exception: ' . $e->getMessage());
            die();
        }
    }
}



class Bruker extends Person {
    public $rollevalg = array();

    function __construct($pBrukernavn) {
        parent::__construct($pBrukernavn);
        parent::update();
        $this->update();
        $this->rid = getrid('Brukernavn', $this->Brukernavn);
        error_log("Initializing bruker {$pBrukernavn}...");
    }

    protected function update($mode = false) {
        if (time() < $this->age + 5*60 && $mode != 'force') { return; }

        try {
            parent::update();
            $this->rollevalg = array();

            $dbc = new DB();
            $db = $dbc->getdb();

            $db_query = $db->prepare('SELECT `Tittel` FROM `BrukerRoller` WHERE `BrukerID` = :brukerid');
            $db_query->execute(array(':brukerid' => $this->BrukerID));
            $db_query->setFetchMode(PDO::FETCH_BOTH);

            foreach ($db_query as $rolle) {
                $this->rollevalg[] = $rolle['Tittel'];
            }
        } catch(Exception $e) {
            error_log('Bruker::update: Caught exception: ',  $e->getMessage());
        }
    }



    public function allowdelegation($delegate) {
        if ($delegate == $this->Brukernavn) { return true; }

        try {
            $dbc = new DB();
            $db = $dbc->getdb();

            $db_query = $db->prepare("SELECT `DelegatBrukernavn` FROM `BrukerDelegater` WHERE `BrukerID` = :brukerid");
            $db_query->execute(array(':brukerid' => $this->BrukerID));
            $db_query->setFetchMode(PDO::FETCH_BOTH);

            foreach ($db_query as $user) {
                if ($user['DelegatBrukernavn'] == $delegate) { return true; }
            }
        } catch(Exception $e) {
            error_log('Bruker::allowdelegation: Caught exception: ',  $e->getMessage());
        }

        return false;
    }



    /*!
        @abstract A function to get the list of all user delegates
        @returns A array of users in the form ('username' => 'fullname')
        @updated 2013-06-13
    */
    public function getdelegatelist() {
        $result = array();

        try {
            $dbc = new DB();
            $db = $dbc->getdb();

            $db_query = $db->prepare("SELECT `DelegatBrukernavn`, `Fornavn`, `Mellomnavn`, `Etternavn`, `Tiltalenavn` FROM `BrukerDelegater` WHERE `BrukerID` = :brukerid");
            $db_query->execute(array(':brukerid' => $this->BrukerID));
            $db_query->setFetchMode(PDO::FETCH_BOTH);
            
            foreach ($db_query as $user) {
                $result[$user['DelegatBrukernavn']] = composename('KortFornavn', $user['Fornavn'], $user['Mellomnavn'], $user['Etternavn'], $user['Tiltalenavn']);
            }

            $collator = new Collator('nb_NO');
            $collator->asort($result);
        } catch(Exception $e) {
            error_log('Bruker::getdelegatelist: Caught exception: ',  $e->getMessage());
        }

        return $result;
    }



    /*!
        @abstract A function to get a list of all user delegates
        @updated 2013-06-13
    */
    public function getroles($brukernavn = null) {
        $result = array();

        try {
            $dbc = new DB();
            $db = $dbc->getdb();

            if ($brukernavn == null or $brukernavn == $this->Brukernavn) {
                $db_query = $db->prepare("SELECT `RolleID`, `Tittel` FROM `BrukerRoller` WHERE `BrukerID` = :brukerid");
                $db_query->execute(array(':brukerid' => $this->BrukerID));
                $db_query->setFetchMode(PDO::FETCH_BOTH);

                foreach ($db_query as $role) {
                    $result[$role['RolleID']] = $role['Tittel'];
                }
            } else {
                $db_query = $db->prepare("SELECT `DelegatRolleID`, `DelegatTittel` FROM `BrukerDelegater` WHERE `BrukerID` = :brukerid AND `DelegatBrukernavn` = :delegatbrukernavn");
                $db_query->execute(array(':brukerid' => $this->BrukerID, ':delegatbrukernavn' => $brukernavn));
                $db_query->setFetchMode(PDO::FETCH_BOTH);

                foreach ($db_query as $role) {
                    $result[$role['DelegatRolleID']] = $role['DelegatTittel'];
                }
            }

            $collator = new Collator('nb_NO');
            $collator->asort($result);
        } catch(Exception $e) {
            error_log('Bruker::getroles: Caught exception: ',  $e->getMessage());
        }

        return $result;
    }



    /*!
        @abstract A function to get a list of all user rights
        @updated 2013-06-13
    */
    public function getrights() {
        $result = array();

        try {
            $dbc = new DB();
            $db = $dbc->getdb();

            $db_query = $db->prepare("SELECT `RettighetID`, `Tittel` FROM `BrukerRettighet` LEFT JOIN `Rettighet` USING (`RettighetID`) WHERE `BrukerID` = :brukerid");
            $db_query->execute(array(':brukerid' => $this->BrukerID));
            $db_query->setFetchMode(PDO::FETCH_BOTH);
            
            foreach ($db_query as $right) {
                $result[$right['RettighetID']] = $right['Tittel'];
            }

            $collator = new Collator('nb_NO');
            $collator->asort($result);
        } catch(Exception $e) {
            error_log('Bruker::getrights: Caught exception: ',  $e->getMessage());
        }

        return $result;
    }



    /*!
        @abstract A function to get a list of all user rights
        @updated 2013-06-13
    */
    public function getmodules($rolle) {
        $result = array();

        try {
            $dbc = new DB();
            $db = $dbc->getdb();

            $db_query = $db->prepare("SELECT `Modul`, `Status` FROM `BrukerModuler` WHERE `BrukerID` = :brukerid AND `Rolle` = :rolle");
            $db_query->execute(array(':brukerid' => $this->BrukerID, ':rolle' => $rolle));
            $result = $db_query->fetchAll();
        } catch(Exception $e) {
            error_log('Bruker::getmodules: Caught exception: ',  $e->getMessage());
        }
        return $result;
    }
}

?>
