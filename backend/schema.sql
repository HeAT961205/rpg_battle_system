--
-- PostgreSQL database dump
--

\restrict N5idUVUYBxbXk7u5KCogYb4QTXlQVGKBJnmeTkCggARtgmMinROIXDk59Ff9kfs

-- Dumped from database version 14.21 (Homebrew)
-- Dumped by pg_dump version 14.21 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- Name: battle_history; Type: TABLE; Schema: public; Owner: Heat
--

CREATE TABLE public.battle_history (
    id integer NOT NULL,
    character_id integer NOT NULL,
    enemy_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    enemy_damage integer DEFAULT 0,
    exp_gained integer DEFAULT 0,
    session_id integer NOT NULL,
    player_damage integer NOT NULL,
    result text DEFAULT 'ongoing'::text
);


ALTER TABLE public.battle_history OWNER TO "Heat";

--
-- Name: battle_history_id_seq; Type: SEQUENCE; Schema: public; Owner: Heat
--

CREATE SEQUENCE public.battle_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.battle_history_id_seq OWNER TO "Heat";

--
-- Name: battle_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Heat
--

ALTER SEQUENCE public.battle_history_id_seq OWNED BY public.battle_history.id;


--
-- Name: battle_party; Type: TABLE; Schema: public; Owner: Heat
--

CREATE TABLE public.battle_party (
    id integer NOT NULL,
    session_id integer,
    character_id integer,
    current_hp integer NOT NULL,
    "position" integer
);


ALTER TABLE public.battle_party OWNER TO "Heat";

--
-- Name: battle_party_id_seq; Type: SEQUENCE; Schema: public; Owner: Heat
--

CREATE SEQUENCE public.battle_party_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.battle_party_id_seq OWNER TO "Heat";

--
-- Name: battle_party_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Heat
--

ALTER SEQUENCE public.battle_party_id_seq OWNED BY public.battle_party.id;


--
-- Name: battle_sessions; Type: TABLE; Schema: public; Owner: Heat
--

CREATE TABLE public.battle_sessions (
    id integer NOT NULL,
    enemy_id integer,
    enemy_hp integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    boss_phase integer DEFAULT 1,
    party_id integer
);


ALTER TABLE public.battle_sessions OWNER TO "Heat";

--
-- Name: battle_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: Heat
--

CREATE SEQUENCE public.battle_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.battle_sessions_id_seq OWNER TO "Heat";

--
-- Name: battle_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Heat
--

ALTER SEQUENCE public.battle_sessions_id_seq OWNED BY public.battle_sessions.id;


--
-- Name: character_skills; Type: TABLE; Schema: public; Owner: Heat
--

CREATE TABLE public.character_skills (
    character_id integer,
    skill_id integer
);


ALTER TABLE public.character_skills OWNER TO "Heat";

--
-- Name: characters; Type: TABLE; Schema: public; Owner: Heat
--

CREATE TABLE public.characters (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    element character varying(20) NOT NULL,
    role character varying(50),
    level integer DEFAULT 1,
    hp integer NOT NULL,
    attack integer NOT NULL,
    defense integer NOT NULL,
    exp integer DEFAULT 0,
    next_exp integer DEFAULT 100,
    max_hp integer
);


ALTER TABLE public.characters OWNER TO "Heat";

--
-- Name: characters_id_seq; Type: SEQUENCE; Schema: public; Owner: Heat
--

CREATE SEQUENCE public.characters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.characters_id_seq OWNER TO "Heat";

--
-- Name: characters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Heat
--

ALTER SEQUENCE public.characters_id_seq OWNED BY public.characters.id;


--
-- Name: enemies; Type: TABLE; Schema: public; Owner: Heat
--

CREATE TABLE public.enemies (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    element character varying(20) NOT NULL,
    phase integer DEFAULT 1,
    hp integer NOT NULL,
    attack integer NOT NULL,
    defense integer NOT NULL,
    exp_reward integer DEFAULT 50,
    max_hp integer,
    is_boss boolean DEFAULT false
);


ALTER TABLE public.enemies OWNER TO "Heat";

--
-- Name: enemies_id_seq; Type: SEQUENCE; Schema: public; Owner: Heat
--

CREATE SEQUENCE public.enemies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.enemies_id_seq OWNER TO "Heat";

--
-- Name: enemies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Heat
--

ALTER SEQUENCE public.enemies_id_seq OWNED BY public.enemies.id;


--
-- Name: parties; Type: TABLE; Schema: public; Owner: Heat
--

CREATE TABLE public.parties (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.parties OWNER TO "Heat";

--
-- Name: parties_id_seq; Type: SEQUENCE; Schema: public; Owner: Heat
--

CREATE SEQUENCE public.parties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.parties_id_seq OWNER TO "Heat";

--
-- Name: parties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Heat
--

ALTER SEQUENCE public.parties_id_seq OWNED BY public.parties.id;


--
-- Name: party_members; Type: TABLE; Schema: public; Owner: Heat
--

CREATE TABLE public.party_members (
    id integer NOT NULL,
    party_id integer,
    character_id integer,
    "position" integer,
    CONSTRAINT party_members_position_check CHECK ((("position" >= 1) AND ("position" <= 3)))
);


ALTER TABLE public.party_members OWNER TO "Heat";

--
-- Name: party_members_id_seq; Type: SEQUENCE; Schema: public; Owner: Heat
--

CREATE SEQUENCE public.party_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.party_members_id_seq OWNER TO "Heat";

--
-- Name: party_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Heat
--

ALTER SEQUENCE public.party_members_id_seq OWNED BY public.party_members.id;


--
-- Name: skills; Type: TABLE; Schema: public; Owner: Heat
--

CREATE TABLE public.skills (
    id integer NOT NULL,
    name text,
    power integer,
    target_type text,
    mp_cost integer
);


ALTER TABLE public.skills OWNER TO "Heat";

--
-- Name: skills_id_seq; Type: SEQUENCE; Schema: public; Owner: Heat
--

CREATE SEQUENCE public.skills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.skills_id_seq OWNER TO "Heat";

--
-- Name: skills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Heat
--

ALTER SEQUENCE public.skills_id_seq OWNED BY public.skills.id;


--
-- Name: battle_history id; Type: DEFAULT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.battle_history ALTER COLUMN id SET DEFAULT nextval('public.battle_history_id_seq'::regclass);


--
-- Name: battle_party id; Type: DEFAULT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.battle_party ALTER COLUMN id SET DEFAULT nextval('public.battle_party_id_seq'::regclass);


--
-- Name: battle_sessions id; Type: DEFAULT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.battle_sessions ALTER COLUMN id SET DEFAULT nextval('public.battle_sessions_id_seq'::regclass);


--
-- Name: characters id; Type: DEFAULT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.characters ALTER COLUMN id SET DEFAULT nextval('public.characters_id_seq'::regclass);


--
-- Name: enemies id; Type: DEFAULT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.enemies ALTER COLUMN id SET DEFAULT nextval('public.enemies_id_seq'::regclass);


--
-- Name: parties id; Type: DEFAULT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.parties ALTER COLUMN id SET DEFAULT nextval('public.parties_id_seq'::regclass);


--
-- Name: party_members id; Type: DEFAULT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.party_members ALTER COLUMN id SET DEFAULT nextval('public.party_members_id_seq'::regclass);


--
-- Name: skills id; Type: DEFAULT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.skills ALTER COLUMN id SET DEFAULT nextval('public.skills_id_seq'::regclass);


--
-- Name: battle_history battle_history_pkey; Type: CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.battle_history
    ADD CONSTRAINT battle_history_pkey PRIMARY KEY (id);


--
-- Name: battle_party battle_party_pkey; Type: CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.battle_party
    ADD CONSTRAINT battle_party_pkey PRIMARY KEY (id);


--
-- Name: battle_sessions battle_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.battle_sessions
    ADD CONSTRAINT battle_sessions_pkey PRIMARY KEY (id);


--
-- Name: characters characters_pkey; Type: CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_pkey PRIMARY KEY (id);


--
-- Name: enemies enemies_pkey; Type: CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.enemies
    ADD CONSTRAINT enemies_pkey PRIMARY KEY (id);


--
-- Name: parties parties_pkey; Type: CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.parties
    ADD CONSTRAINT parties_pkey PRIMARY KEY (id);


--
-- Name: party_members party_members_party_id_position_key; Type: CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.party_members
    ADD CONSTRAINT party_members_party_id_position_key UNIQUE (party_id, "position");


--
-- Name: party_members party_members_pkey; Type: CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.party_members
    ADD CONSTRAINT party_members_pkey PRIMARY KEY (id);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: battle_history battle_history_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.battle_history
    ADD CONSTRAINT battle_history_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id);


--
-- Name: battle_history battle_history_enemy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.battle_history
    ADD CONSTRAINT battle_history_enemy_id_fkey FOREIGN KEY (enemy_id) REFERENCES public.enemies(id);


--
-- Name: battle_party battle_party_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.battle_party
    ADD CONSTRAINT battle_party_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id);


--
-- Name: battle_party battle_party_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.battle_party
    ADD CONSTRAINT battle_party_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.battle_sessions(id);


--
-- Name: battle_sessions battle_sessions_enemy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.battle_sessions
    ADD CONSTRAINT battle_sessions_enemy_id_fkey FOREIGN KEY (enemy_id) REFERENCES public.enemies(id);


--
-- Name: battle_sessions battle_sessions_party_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.battle_sessions
    ADD CONSTRAINT battle_sessions_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.parties(id);


--
-- Name: character_skills character_skills_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.character_skills
    ADD CONSTRAINT character_skills_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id);


--
-- Name: character_skills character_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.character_skills
    ADD CONSTRAINT character_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id);


--
-- Name: party_members party_members_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.party_members
    ADD CONSTRAINT party_members_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id);


--
-- Name: party_members party_members_party_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Heat
--

ALTER TABLE ONLY public.party_members
    ADD CONSTRAINT party_members_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.parties(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict N5idUVUYBxbXk7u5KCogYb4QTXlQVGKBJnmeTkCggARtgmMinROIXDk59Ff9kfs

