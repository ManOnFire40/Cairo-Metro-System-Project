CREATE DATABASE CairoMetro;

-- DROP DATABASE CairoMetro;


CREATE TABLE IF NOT EXISTS public."Metro"
(
    "Metro_id"               integer NOT NULL,
    max_num_of_passengers    integer NOT NULL,
    num_of_reserved_customer integer,
    CONSTRAINT "Metro_pkey" PRIMARY KEY ("Metro_id")
)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Metro"
    OWNER to postgres;



CREATE TABLE IF NOT EXISTS public."user"
(
    email    text COLLATE pg_catalog."default" NOT NULL,
    password text COLLATE pg_catalog."default" NOT NULL,
    name     text COLLATE pg_catalog."default" NOT NULL,
    age      integer                           NOT NULL,
    "ID"     integer                           NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    "Role"   text COLLATE pg_catalog."default" NOT NULL DEFAULT 'user'::text,
    "SSN"    text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "ID" PRIMARY KEY ("ID"),
    CONSTRAINT "SSN" UNIQUE ("SSN"),
    CONSTRAINT email UNIQUE (email)
)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."user"
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public.request
(
    request_type text COLLATE pg_catalog."default" NOT NULL,
    is_approved  boolean                           NOT NULL,
    "request_ID" integer                           NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    "sender_ID"  integer                           NOT NULL,
    "reciver_ID" integer,
    CONSTRAINT "request_ID" PRIMARY KEY ("request_ID"),
    CONSTRAINT "reciver_ID" FOREIGN KEY ("reciver_ID")
        REFERENCES public."user" ("ID") MATCH SIMPLE
        ON UPDATE SET NULL
        ON DELETE SET NULL,
    CONSTRAINT "sender_ID" FOREIGN KEY ("sender_ID")
        REFERENCES public."user" ("ID") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.request
    OWNER to postgres;



CREATE TABLE IF NOT EXISTS public.route
(
    name             text COLLATE pg_catalog."default" NOT NULL,
    "route_ID"       integer                           NOT NULL,
    pricing_schedule text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "route_ID" PRIMARY KEY ("route_ID")
)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.route
    OWNER to postgres;


CREATE TABLE IF NOT EXISTS public.stations
(
    name         text COLLATE pg_catalog."default" NOT NULL,
    "station_ID" integer                           NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    CONSTRAINT "station_ID" PRIMARY KEY ("station_ID")
)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.stations
    OWNER to postgres;



CREATE TABLE IF NOT EXISTS public.trip
(
    origin_point      text COLLATE pg_catalog."default" NOT NULL,
    destination_point text COLLATE pg_catalog."default" NOT NULL,
    "Date"            date                              NOT NULL,
    timing            text COLLATE pg_catalog."default" NOT NULL,
    "trip_ID"         integer                           NOT NULL,
    "route_ID"        integer                           NOT NULL,
    "stations_ID"     integer,
    CONSTRAINT "trip_ID" PRIMARY KEY ("trip_ID"),
    CONSTRAINT "route_ID" FOREIGN KEY ("route_ID")
        REFERENCES public.route ("route_ID") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT "stations_ID" FOREIGN KEY ("stations_ID")
        REFERENCES public.stations ("station_ID") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.trip
    OWNER to postgres;


CREATE TABLE IF NOT EXISTS public.ticket
(
    type        text COLLATE pg_catalog."default" NOT NULL,
    "ticket_ID" integer                           NOT NULL,
    "trip_ID"   integer                           NOT NULL,
    price       double precision                  NOT NULL,
    "User_ID"   integer,
    is_one_ride boolean                           NOT NULL,
    "DISCOUNT"  double precision DEFAULT '0'::double precision,
    CONSTRAINT "ticket_ID" PRIMARY KEY ("ticket_ID"),
    CONSTRAINT "User_ID" FOREIGN KEY ("User_ID")
        REFERENCES public."user" ("ID") MATCH SIMPLE
        ON UPDATE SET NULL
        ON DELETE SET NULL,
    CONSTRAINT "trip_ID" FOREIGN KEY ("trip_ID")
        REFERENCES public.trip ("trip_ID") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.ticket
    OWNER to postgres;



CREATE TABLE IF NOT EXISTS public.rides
(
    "trip_ID"    integer NOT NULL,
    "ticket_ID"  integer NOT NULL,
    "User_ID"    integer NOT NULL,
    is_completed boolean NOT NULL,
    ride_id      integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    CONSTRAINT ride_id PRIMARY KEY (ride_id),
    CONSTRAINT "User_ID" FOREIGN KEY ("User_ID")
        REFERENCES public."user" ("ID") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT "ticket_ID" FOREIGN KEY ("ticket_ID")
        REFERENCES public.ticket ("ticket_ID") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT "trip_ID" FOREIGN KEY ("trip_ID")
        REFERENCES public.trip ("trip_ID") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.rides
    OWNER to postgres;