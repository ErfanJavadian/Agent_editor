# Browser Project Store

`IndexedDbProjectStore` is the first persistence adapter for the web client.

## Stored records

- `projects`: versioned project manifest serialized and validated by `project-core`.
- `media`: original imported Blob, file name, MIME type, and update timestamp.

The editor stores media bytes in the browser's IndexedDB database named `agent-editor-local`. It does not upload imported files to the backend or a remote service.

## Guarantees and limits

- A project manifest is validated before it is written and after it is read.
- Media records are keyed by stable media IDs and can be rehydrated into temporary object URLs for preview.
- Project and media records are stored separately; deleting a timeline clip does not delete the source media.
- Browser storage can be cleared by the user or evicted by the browser. This is not a substitute for user-controlled backups.
- This adapter is browser-specific. Desktop and Android native clients will need adapters implementing the same persistence contract.
- Cross-device project packaging and media relinking are not implemented yet.

## Tests

The IndexedDB adapter tests use `fake-indexeddb` and run through `npm test` from `frontend/`.
