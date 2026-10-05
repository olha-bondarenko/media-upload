from app.config import Settings


def test_plain_postgres_urls_are_rewritten_to_use_psycopg():
    settings = Settings(database_url="postgresql://u:p@host:5432/db", _env_file=None)

    assert settings.database_url == "postgresql+psycopg://u:p@host:5432/db"


def test_cors_origins_are_split_and_trimmed():
    settings = Settings(cors_origins="http://a.test, http://b.test ,", _env_file=None)

    assert settings.cors_origin_list == ["http://a.test", "http://b.test"]
