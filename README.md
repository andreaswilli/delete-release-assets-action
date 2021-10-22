# delete-release-assets-action

A simple GitHub action which deletes all assets attached to a release. It is mainly designed to make sure electron-builder doesn't fail in case an asset already exists.

## Inputs

| name                   | required? | default  | description                                                                                 |
| ---------------------- | --------- | -------- | ------------------------------------------------------------------------------------------- |
| `github_token`         | yes       | -        | GitHub Access Token (usually `secrets.GITHUB_TOKEN`)                                        |
| `tag`                  | no        | `''`     | Tag name that identifies the release (version is read from `package.json` if not specified) |
| `tagPrefix`            | no        | `''`     | Prefix that is automatically added to the start of the tag name                             |
| `deleteOnlyFromDrafts` | no        | `'true'` | Delete assets only from draft releases or all releases                                      |

## Example usage

```yml
name: Delete Release Assets

on: push

jobs:
  deleteReleaseAssets:
    runs-on: ubuntu-latest

    steps:
      - name: Check out Git repository
        uses: actions/checkout@v1

      - name: Delete current release assets
        uses: andreaswilli/delete-release-assets-action@<version>
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          tagPrefix: v
          tag: 1.0.1
```
