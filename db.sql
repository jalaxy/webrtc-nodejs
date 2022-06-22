drop database if exists `meetings_db`;
create database `meetings_db`;
use `meetings_db`;

create table `room` (
    `room_id` char(16) not null,
    `passwd` varchar(64) not null,
    primary key (`room_id`)
);

create table `last` (
    `room_id` char(16) not null,
    primary key (`room_id`),
    constraint fk_last_room
        foreign key (`room_id`) references `room`(`room_id`)
        on delete cascade on update cascade
);

create table sessions (
    `session_id` varchar(128) not null,
    `expires` int(11) not null,
    `data` mediumtext,
    primary key (`session_id`)
);

create table `login` (
    `room_id` char(16) not null,
    `session_id` varchar(128) not null,
    `user_name` varchar(64),
    `start` datetime default current_timestamp,
    `end` datetime,
    `status` varchar(16) default 'online',
    primary key (`room_id`, `session_id`),
    constraint fk_login_room
        foreign key (`room_id`) references `room`(`room_id`)
        on delete cascade on update cascade,
    constraint fk_login_session
        foreign key (`session_id`) references `sessions`(`session_id`)
        on delete cascade on update cascade
);

delimiter -;
create trigger `before_room_id_insert`
    before insert on `room`
    for each row
begin
    declare `sel` char(16);
    repeat
        set new.`room_id` = substr(md5(rand()), 1, 16);
        set `sel` = (
            select count(*) from `room`
            where `room`.`room_id` = new.`room_id`);
    until `sel` = 0 end repeat;
end-;

create trigger `after_room_id_insert`
    after insert on `room`
    for each row
begin
    if (select count(*) from `last`) != 1 then
        delete from `last`;
        insert into `last` values(new.`room_id`);
    else
        update `last` set `room_id` = new.`room_id`;
    end if;
end-;
delimiter ;

insert into `room`(`passwd`) values(sha2('123', 256));
update `room` set `room_id` = 'test';
