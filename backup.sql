--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Debian 17.5-1.pgdg120+1)
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: notes; Type: TABLE; Schema: public; Owner: tino_user
--

CREATE TABLE public.notes (
    id uuid NOT NULL,
    title character varying,
    original_transcription character varying,
    summary character varying,
    media_duration_seconds double precision,
    created_at timestamp with time zone DEFAULT now(),
    owner_id integer
);


ALTER TABLE public.notes OWNER TO tino_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: tino_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying,
    student_id character varying,
    api_key character varying,
    daily_credits integer
);


ALTER TABLE public.users OWNER TO tino_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: tino_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO tino_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tino_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: tino_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: tino_user
--

COPY public.notes (id, title, original_transcription, summary, media_duration_seconds, created_at, owner_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: tino_user
--

COPY public.users (id, name, student_id, api_key, daily_credits) FROM stdin;
1	박종호	2023148039	cc1f48e3c42246a2dddff9361a75007ed0aaee03a38a1b279ad5765bbc06f670	1000
\.


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: tino_user
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: tino_user
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: tino_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_notes_title; Type: INDEX; Schema: public; Owner: tino_user
--

CREATE INDEX ix_notes_title ON public.notes USING btree (title);


--
-- Name: ix_users_api_key; Type: INDEX; Schema: public; Owner: tino_user
--

CREATE UNIQUE INDEX ix_users_api_key ON public.users USING btree (api_key);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: tino_user
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_name; Type: INDEX; Schema: public; Owner: tino_user
--

CREATE INDEX ix_users_name ON public.users USING btree (name);


--
-- Name: ix_users_student_id; Type: INDEX; Schema: public; Owner: tino_user
--

CREATE UNIQUE INDEX ix_users_student_id ON public.users USING btree (student_id);


--
-- Name: notes notes_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tino_user
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

