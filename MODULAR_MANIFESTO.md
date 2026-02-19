# Modular Manifesto for Repo Crawler MCP

## Purpose
To ensure the repo-crawler-mcp is dependable, maintainable, and extensible, we commit to a modular, layered architecture. Each layer and module must be independently testable, replaceable, and clearly documented.

## Principles

1. **Layered Architecture**
   - Start with a deterministic core (data fetching, parsing, and normalization).
   - Add higher-level features (analytics, UI, AI augmentation) in distinct, decoupled layers.

2. **Single Responsibility**
   - Each module does one thing well (e.g., GitHub fetcher, CSV exporter, Markdown renderer).
   - No module should depend on implementation details of another; use interfaces/contracts.

3. **Explicit Interfaces**
   - All modules expose clear, versioned interfaces (TypeScript types, OpenAPI specs, etc.).
   - Data passed between layers must be validated and documented.

4. **Replaceability**
   - Any module can be swapped out (e.g., switch from GitHub to GitLab fetcher) with minimal impact.

5. **Determinism First**
   - The core layer must produce consistent, reproducible results from the same input.
   - No side effects or randomness in the deterministic layer.

6. **Testability**
   - Each module and layer must have automated tests (unit, integration, and contract tests).

7. **Extensibility**
   - New features or integrations must be added as new modules/layers, not by modifying core logic.

8. **Documentation**
   - Every module and interface must be documented with usage, contracts, and examples.

## Enforcement
- All code reviews must check for modularity, determinism, and adherence to this manifesto.
- CI must enforce interface contracts and run all tests before merging.
- Breaking changes to interfaces require version bumps and migration guides.

---

By following this Modular Manifesto, we ensure repo-crawler-mcp remains robust, adaptable, and easy to maintain as it grows.
