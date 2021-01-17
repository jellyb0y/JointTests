SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
echo $SCRIPTPATH
ver=$(cat $SCRIPTPATH/core/manifest.json | grep -oP '(?<=version":\s")(\d\.\d\.\d)')
echo $ver
zip -r "$SCRIPTPATH/dist/v.$ver.zip" $SCRIPTPATH/core