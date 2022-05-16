drop database if exists `meetings_db`;
create database `meetings_db`;
use `meetings_db`;

create table `room` (
    `room_id` char(16),
    `passwd` varchar(64) ,
    primary key (`room_id`)
);

create table `last_room_id` (
    `room_id` char(16),
    primary key (`room_id`),
    constraint fk_last_room_id_room
        foreign key (`room_id`) references `room`(`room_id`)
    on delete cascade
    on update cascade
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
    if (select count(*) from `last_room_id`) != 1 then
        delete from `last_room_id`;
        insert into `last_room_id` values(new.`room_id`);
    else
        update `last_room_id` set `room_id` = new.`room_id`;
    end if;
end-;
delimiter ;
