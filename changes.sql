use agrafka
alter table games add column creator int not null;
alter table games add foreign key (creator) references users(`id`);

