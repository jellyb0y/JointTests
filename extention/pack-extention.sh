SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
ver=$(cat $SCRIPTPATH/core/manifest.json | grep -oP '(?<=version":\s")(\d\.\d\.\d)')
echo "new version: $ver"
cd $SCRIPTPATH/core
zip -r $SCRIPTPATH/dist/v.$ver.zip ./*
