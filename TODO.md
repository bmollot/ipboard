- Save settings feedback
- Mechanism for bans/discarding invalid entries

- Drag/Drop uploads
- Copy/Paste uploads

- syncwatch
- spoiler tags
- bold
- italics
- preformatted
- selection rolls
- 8ball

- fetch attachments in background (under some size)
  - Purge old attachments in favor of new ones to keep total cache under some size

- nicer buttons
- code highlighting
- global user profile
- user profile editing
- preProcessors
- img2text

- Optionally use IPFS gateway rather than js-ipfs
- Port client
  - CLI
  - Election
  - Native?

- ID authentication
  - Track ID <-> Public Key pairs
  - Add signatures to posts (sign contents with private key)
  - Verify signatures of new posts claiming a known ID

- Implement proper multihash parsing (currently just assumes 34 byte length)

- Styling - themes?

- IPFS download progress indicator? Harder than I thought. May have to dig around ipfs internals.
- IPFS type bindings
- bans?
- Liveposting?
  - interaction with spoiler tags?
- Mobile - "responsive design", so breakpoints
- Welcome page
- Thread list?
  - Boards
    - Board list?
- Text commands
  - Per-thread text processing
- Replies
- Link parsing
  - Web
    - generic
    - media
      - image
        - generic
        - imgur
      - audio
       - generic
       - sc
      - gif
      - video
        - generic
        - yt
        - imgur gifv
    - external boards - threads/posts
      - 4chan
      - 8chan
      - 2ch
      - meguca
  - ipfs/ipns
    - media
      - image
      - audio
      - video
    - internal post references
  - thread ids