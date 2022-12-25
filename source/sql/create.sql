CREATE TABLE `Person` (
  `PersonID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `Lastname` varchar(255) NOT NULL DEFAULT '',
  `Firstname` varchar(255) NOT NULL DEFAULT '',
  `Middlename` varchar(255) DEFAULT NULL,
  `Birthdate` date NOT NULL,
  PRIMARY KEY (`PersonID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Person data';



CREATE TABLE `User` (
  `UserID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `PersonID` int(11) unsigned NOT NULL,
  `Username` varchar(32) NOT NULL,
  `PasswordHash` varchar(256) NOT NULL,
  `FromDate` date NOT NULL,
  `ToDate` date DEFAULT NULL,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `Username` (`Username`),
  UNIQUE KEY `PersonID` (`PersonID`) USING BTREE,
  CONSTRAINT `User_ibfk_1` FOREIGN KEY (`PersonID`) REFERENCES `Person` (`PersonID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
