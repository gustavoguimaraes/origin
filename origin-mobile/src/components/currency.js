import React, { Component } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'

const IMAGES_PATH = '../../assets/images/'

export default class Currency extends Component {
  render() {
    const { abbreviation, balance, imageSource, labelColor } = this.props

    return (
      <View style={styles.container}>
        <Image source={imageSource} style={styles.icon} />
        <View style={styles.text}>
          <Text style={{ ...styles.abbreviation, color: labelColor }}>{abbreviation}</Text>
          <Text style={styles.balance}>{Number(balance).toFixed(5)}</Text>
        </View>
        <Image source={require(`${IMAGES_PATH}plus-icon.png`)} style={styles.plus} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  abbreviation: {
    fontFamily: 'Lato',
    fontSize: 8,
  },
  balance: {
    color: 'white',
    fontFamily: 'Lato',
    fontSize: 14,
  },
  container: {
    backgroundColor: '#293f55',
    borderRadius: 10,
    flexDirection: 'row',
    height: 56,
    marginRight: 10,
    padding: 10,
    width: 160,
  },
  icon: {
    height: 30,
    width: 30,
  },
  plus: {
    marginLeft: 'auto',
  },
  text: {
    paddingLeft: 10,
  },
})
