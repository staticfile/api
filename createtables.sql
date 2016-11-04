CREATE TABLE `libraries` (
 `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
 `name` text NOT NULL,
 `version` text NOT NULL,
 `description` text,
 `homepage` text NOT NULL,
 `keywords` text,
 `repositories` text,
 `weight` int(11) DEFAULT '0',
 PRIMARY KEY (`id`),
 UNIQUE KEY `name` (`name`(10)),
 KEY `keywords` (`keywords`(30)),
 FULLTEXT KEY `description` (`description`)
) ENGINE=InnoDB AUTO_INCREMENT=7670 DEFAULT CHARSET=utf8;
CREATE TABLE `assets` (
 `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
 `version` text,
 `files` longtext,
 `library` text NOT NULL,
 PRIMARY KEY (`id`),
 UNIQUE KEY `version` (`version`(30),`library`(30)) USING BTREE,
 KEY `library` (`library`(10))
) ENGINE=InnoDB AUTO_INCREMENT=150989 DEFAULT CHARSET=utf8;