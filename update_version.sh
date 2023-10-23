# bash script that takes a version number as an argument and updates the version number in the following files:
#   - package.json
#   - src-tauri/Cargo.toml
#   - src-tauri/tauri.conf.json

# Get the version number from the first argument
VERSION=$1

# Get the current version number from package.json
CURRENT_VERSION=$(cat package.json | grep version | cut -d '"' -f 4)

# Check if the version number is valid
if [[ ! $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid version number: $VERSION"
  exit 1
fi

# Check if the version number is different from the current version number
if [[ $VERSION == $CURRENT_VERSION ]]; then
  echo "Version number is already $VERSION"
  exit 1
fi

# Check if the version number is greater than the current version number
if [[ $VERSION < $CURRENT_VERSION ]]; then
  echo "Version number is less than the current version number: $CURRENT_VERSION"
  exit 1
fi

# Update the version number in package.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/g" package.json

# Update the version number in src-tauri/Cargo.toml (only the first occurrence)
sed -i '' "0,/^version = \".*\"/s//version = \"$VERSION\"/" src-tauri/Cargo.toml

# Update the version number in src-tauri/tauri.conf.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/g" src-tauri/tauri.conf.json