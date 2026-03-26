from app.services import LEARNING_PATHS, get_learning_unit


def test_every_featured_unit_slug_resolves() -> None:
    missing_slugs: list[str] = []

    for path in LEARNING_PATHS:
        for slug in path.featured_unit_slugs:
            if get_learning_unit(slug) is None:
                missing_slugs.append(slug)

    assert missing_slugs == []


def test_each_learning_path_exposes_multiple_units() -> None:
    for path in LEARNING_PATHS:
        assert len(path.featured_unit_slugs) >= 2
