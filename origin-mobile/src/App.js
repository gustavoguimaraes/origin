import React, { Component, Fragment } from 'react'
import { ActivityIndicator, Alert, Image, PushNotificationIOS, StyleSheet, View, YellowBox } from 'react-native'
import { createBottomTabNavigator, createStackNavigator } from 'react-navigation'
import { connect, Provider } from 'react-redux'

import NavigationService from './NavigationService'
import originWallet, { Events } from './OriginWallet'
import Store from './Store'

import { storeNotificationsPermissions, updateCarouselStatus } from 'actions/Activation'
import { setDevices } from 'actions/Devices'
import { fetchProfile } from 'actions/Profile'
import { getBalance } from 'actions/Wallet'
import { newEvent, updateEvent, processedEvent, setActiveEvent } from 'actions/WalletEvents'

import Onboarding from 'components/onboarding'

import DevicesScreen from 'screens/devices'
import HomeScreen from 'screens/home'
import MessagingScreen from 'screens/messaging'
import ScanScreen from 'screens/scan'
import SettingsScreen from 'screens/settings'
import WalletScreen from 'screens/wallet'

import { loadData } from './tools'

const IMAGES_PATH = '../assets/images/'

YellowBox.ignoreWarnings([
  // https://github.com/facebook/react-native/issues/18868
  'Warning: isMounted(...) is deprecated',
  // https://github.com/facebook/react-native/issues/17504
  'Module RCTImageLoader requires main queue setup'
])

const navigationOptions = ({ navigation }) => ({
  headerStyle: {
    backgroundColor: 'white',
  },
})

const HomeStack = createStackNavigator({
  Home: HomeScreen,
}, {
  navigationOptions,
})

const MessagingStack = createStackNavigator({
  Messaging: MessagingScreen,
}, {
  navigationOptions,
})

const ScanStack = createStackNavigator({
  Scan: ScanScreen,
}, {
  navigationOptions,
})

const SettingsStack = createStackNavigator({
  Devices: DevicesScreen,
  Settings: SettingsScreen,
  Wallet: WalletScreen,
}, {
  initialRouteName: 'Settings',
  navigationOptions,
})

const OriginNavigator = createBottomTabNavigator({
  Home: HomeStack,
  Messaging: MessagingStack,
  Scan: ScanStack,
  Settings: SettingsStack,
}, {
  initialRouteName: 'Home',
  order: ['Home', 'Messaging', 'Scan', 'Settings'],
  navigationOptions: ({ navigation }) => ({
    tabBarIcon: ({ focused, tintColor }) => {
      const { routeName } = navigation.state

      // require expects string literal :(
      if (routeName === 'Home') {
        return focused ?
          <Image source={require(IMAGES_PATH + 'home-active.png')} /> :
          <Image source={require(IMAGES_PATH + 'home-inactive.png')} />
      } else if (routeName === 'Messaging') {
        return focused ?
          <Image source={require(IMAGES_PATH + 'messaging-active.png')} /> :
          <Image source={require(IMAGES_PATH + 'messaging-inactive.png')} />
      } else if (routeName === 'Scan') {
        return focused ?
          <Image source={require(IMAGES_PATH + 'scan-active.png')} /> :
          <Image source={require(IMAGES_PATH + 'scan-inactive.png')} />
      } else if (routeName === 'Settings') {
        return focused ?
          <Image source={require(IMAGES_PATH + 'settings-active.png')} /> :
          <Image source={require(IMAGES_PATH + 'settings-inactive.png')} />
      }
    },
  }),
  tabBarOptions: {
    activeTintColor: '#007fff',
    inactiveTintColor: '#c0cbd4',
    style: {
      backgroundColor: 'white',
    },
    iconStyle: {
      marginTop: 10,
    },
    labelStyle: {
      fontFamily: 'Lato',
      fontSize: 10,
      fontWeight: 'normal',
    },
    tabStyle: {
      justifyContent: 'space-around',
    }
  },
})

const styles = StyleSheet.create({
  centerText: {
    fontSize: 18,
    padding: 10,
    textAlign:'center',
  },
  textBold: {
    fontWeight: '500',
  },
  buttonText: {
    color: 'rgb(0,122,255)',
    fontSize: 21,
  },
  buttonTouchable: {
    padding: 16,
  },
  input: {
    borderColor: 'gray',
    borderWidth: 1,
    color: 'black',
    height: 40,
    margin: 15,
  },
})

// Origin Nav wrapper
class OriginNavWrapper extends Component {
  componentDidMount() {
    PushNotificationIOS.checkPermissions(permissions => {
      this.props.storeNotificationsPermissions(permissions)
    })

    originWallet.initNotifications()
    //register the service here
    originWallet.events.on(Events.PROMPT_LINK, (data, matcher) => {
      this.props.newEvent(matcher, data)
      this.props.setActiveEvent(data)
      NavigationService.navigate('Home')
    })

    originWallet.events.on(Events.PROMPT_TRANSACTION, (data, matcher) => {
      this.props.newEvent(matcher, data)
      this.props.setActiveEvent(data)
      NavigationService.navigate('Home')
    })

    originWallet.events.on(Events.PROMPT_SIGN, (data, matcher) => {
      this.props.newEvent(matcher, data)
      this.props.setActiveEvent(data)
      NavigationService.navigate('Home')
    })

    originWallet.events.on(Events.NEW_ACCOUNT, (data, matcher) => {
      this.props.fetchProfile()
      this.props.getBalance()
    })

    originWallet.events.on(Events.LINKED, (data, matcher) => {
      this.props.processedEvent(matcher, {}, data)
      NavigationService.navigate('Home')
    })

    originWallet.events.on(Events.TRANSACTED, (data, matcher) => {
      this.props.processedEvent(matcher, { status: 'completed' }, data)
      this.props.getBalance()
      NavigationService.navigate('Home')
    })

    originWallet.events.on(Events.UNLINKED, (data, matcher) => {
      this.props.updateEvent(matcher, { linked: false })
    })

    originWallet.events.on(Events.REJECT, (data, matcher) => {
      this.props.processedEvent(matcher, { status: 'rejected' }, data)
      NavigationService.navigate('Home')
    })

    originWallet.events.on(Events.LINKS, (devices) => {
      this.props.setDevices(devices)
    })

    originWallet.events.on(Events.UPDATE, () => {
      this.props.getBalance()
    })

    originWallet.events.on(Events.NEW_MESSAGE, () => {
      // TODO: show indicator of new message here
    })

    originWallet.events.on(Events.SHOW_MESSAGES, () => {
      NavigationService.navigate('Messaging')
    })

    originWallet.openWallet()
  }

  componentWillUnmount() {
    originWallet.closeWallet()
  }

  render() {
    return <OriginNavigator ref={navigatorRef =>
      NavigationService.setTopLevelNavigator(navigatorRef)
    } />
  }
}

class OriginWrapper extends Component {
  constructor(props) {
    super(props)

    this.state = { loading: true }
  }

  async componentDidMount() {
    const completed = await loadData('carouselCompleted')

    this.props.updateCarouselStatus(!!completed)

    this.setState({ loading: false })
  }

  render() {
    const { activation, updateCarouselStatus } = this.props
    const { loading } = this.state
    const { carouselCompleted } = activation

    return loading ?
      <View style={{ backgroundColor: '#293f55', flex: 1, justifyContent: 'space-around' }}>
        <ActivityIndicator size="large" color="white" />
      </View> :
      <Fragment>
        {!carouselCompleted &&
          <Onboarding
            onCompletion={() => this.props.updateCarouselStatus(true)}
            pages={[
              {
                image: <Image style={{ maxHeight: '100%', maxWidth: '50%' }} source={require(IMAGES_PATH + 'carousel-1.png')} />,
                title: 'Store & Use Crypto',
                subtitle: 'The Origin Mobile Wallet will allow you to store cryptocurrency to buy and sell on the Origin Marketplace.',
              },
              {
                image: <Image style={{ maxHeight: '100%', maxWidth: '50%' }} source={require(IMAGES_PATH + 'carousel-2.png')} />,
                title: 'Message Buyers & Sellers',
                subtitle: 'Use the app to communicate with others on the Origin Marketplace in order to move your transactions.',
              },
              {
                image: <Image style={{ maxHeight: '100%', maxWidth: '50%' }} source={require(IMAGES_PATH + 'carousel-3.png')} />,
                title: 'Stay Up to Date',
                subtitle: 'The Origin Mobile Wallet will notify you when there are transactions that require your attention.',
              },
            ]}
          />
        }
        {carouselCompleted &&
          <OriginNavWrapper {...this.props} />
        }
      </Fragment>
  }
}

const mapStateToProps = ({ activation }) => {
  return {
    activation,
  }
}

const mapDispatchToProps = dispatch => ({
  fetchProfile: () => dispatch(fetchProfile()),
  getBalance: () => dispatch(getBalance()),
  newEvent: (matcher, event) => dispatch(newEvent(matcher, event)),
  processedEvent: (matcher, update, new_event) => dispatch(processedEvent(matcher, update, new_event)),
  setActiveEvent: event => dispatch(setActiveEvent(event)),
  setDevices: devices => dispatch(setDevices(devices)),
  storeNotificationsPermissions: () => dispatch(storeNotificationsPermissions()),
  updateCarouselStatus: bool => dispatch(updateCarouselStatus(bool)),
  updateEvent: (matcher, update) => dispatch(updateEvent(matcher, update)),
})

const OriginWallet = connect(mapStateToProps, mapDispatchToProps)(OriginWrapper)

export default class OriginApp extends Component {
  render() {
    return (
      <Provider store={Store}>
        <OriginWallet />
      </Provider>
    )
  }
}
