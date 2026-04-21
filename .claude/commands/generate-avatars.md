Generate NPC character avatar images using AI Horde.

Run the avatar generation script:

```
node scripts/generate-avatars.mjs $ARGUMENTS
```

- No arguments: generates all missing avatars (skips existing ones)
- Pass a character ID to generate/regenerate a specific one: `li-yunshu`, `wang-tie`, `mysterious-elder`, `yan-chixing`, `ling-xue`, `su-qing`

The script requires the `AIHORDE_API_KEY` environment variable. If not set, it uses the anonymous key (slower queue).

Images are saved to `assets/characters/{id}.png`.

After generation, open the image to verify quality. If the result is unsatisfactory, re-run with the specific character ID to regenerate.
