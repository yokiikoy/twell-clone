from __future__ import annotations


def pytest_configure(config):  # type: ignore[no-untyped-def]
    config.addinivalue_line("markers", "integration: network downloads or long pipeline")
