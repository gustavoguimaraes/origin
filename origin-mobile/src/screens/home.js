import React, { Component, Fragment } from 'react'
import { Image, ScrollView, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { connect } from 'react-redux'

import { setActiveEvent } from 'actions/WalletEvents'

import Currency from 'components/currency'
import DeviceItem from 'components/device-item'
import DeviceModal from 'components/device-modal'
import NotificationsModal from 'components/notifications-modal'
import Separator from 'components/separator'
import SignItem from 'components/sign-item'
import SignModal from 'components/sign-modal'
import TransactionItem from 'components/transaction-item'
import TransactionModal from 'components/transaction-modal'
import WalletModal from 'components/wallet-modal'

import currencies from 'utils/currencies'

import originWallet from '../OriginWallet'

const IMAGES_PATH = '../../assets/images/'

class HomeScreen extends Component {
  constructor(props) {
    super(props)

    this.toggleModal = this.toggleModal.bind(this)
    this.toggleWallet = this.toggleWallet.bind(this)
    this.state = {
      recentItems: [],
      walletExpanded: false,
    }
  }

  static navigationOptions = {
    title: 'Home',
    headerTitle: () => (
      <Image source={require(`${IMAGES_PATH}origin-logo-dark.png`)} />
    ),
  }

  async acceptItem(item){
    const done = await originWallet.handleEvent(item)

    if (done) {
      this.toggleModal()
    }
  }

  rejectItem(item){
    originWallet.handleReject(item)

    this.toggleModal()
  }

  toggleModal() {
    this.props.setActiveEvent(null)
  }

  toggleWallet() {
    this.setState({ walletExpanded: !this.state.walletExpanded })
  }

  render() {
    const { active_event, address, balances: { eth, ogn, dai }, navigation, pending_events, processed_events } = this.props
    const ethBalance = web3.utils.fromWei(eth, 'ether')
    // To Do: convert tokens with decimal counts
    const daiBalance = dai
    const ognBalance = ogn

    return (
      <Fragment>
        <View style={styles.walletContainer}>
          <TouchableOpacity activeOpacity={0.9} onPress={this.toggleWallet}>
            <View style={styles.walletHeader}>
              <Text style={styles.walletHeading}>Wallet Balances</Text>
              <Image source={require(`${IMAGES_PATH}expand-icon.png`)} style={styles.expand} />
            </View>
          </TouchableOpacity>
          <ScrollView
            horizontal={true}
            style={styles.svContainer}
            contentContainerStyle={styles.walletSVContainer}
          >
            <Currency
              abbreviation={'ETH'}
              balance={ethBalance}
              labelColor={currencies['eth'].color}
              name={currencies['eth'].name}
              imageSource={currencies['eth'].icon}
              onPress={this.toggleWallet}
            />
            <Currency
              abbreviation={'OGN'}
              balance={ognBalance}
              labelColor={currencies['ogn'].color}
              name={currencies['ogn'].name}
              imageSource={currencies['ogn'].icon}
              onPress={this.toggleWallet}
            />
            <Currency
              abbreviation={'DAI'}
              balance={daiBalance}
              labelColor={currencies['dai'].color}
              name={currencies['dai'].name}
              imageSource={currencies['dai'].icon}
              onPress={this.toggleWallet}
            />
          </ScrollView>
          <WalletModal address={address} visible={this.state.walletExpanded} onPress={this.toggleWallet} />
        </View>
        <SectionList
          keyExtractor={({ event_id }) => event_id}
          renderItem={({ item, section }) => {
            if (section.title === 'Pending') {
              switch(item.action) {
                case 'transaction':
                  return (
                    <TransactionItem
                      item={item}
                      address={address}
                      navigation={navigation}
                      handleApprove={() => originWallet.handleEvent(item)}
                      handleReject={() => originWallet.handleReject(item)}
                    />
                  )
                case 'link':
                  return (
                    <DeviceItem
                      item={item}
                      navigation={navigation}
                      handleLink={() => originWallet.handleEvent(item)}
                      handleReject={() => originWallet.handleReject(item)}
                    />
                  )
                case 'sign':
                  return (
                    <SignItem
                    item={item}
                    address={address}
                    balance={eth}
                    navigation={navigation}
                    handleApprove={() => originWallet.handleEvent(item)}
                    handlePress={() => this.props.setActiveEvent(item)}
                    handleReject={() => originWallet.handleReject(item)}
                    />
                  )
                default:
                  return null
              }
            } else {
              switch(item.action) {
                case 'transaction':
                  return (
                    <TransactionItem
                      item={item} 
                      address={address}
                      balance={eth}
                      navigation={navigation}
                    />
                  )
                case 'sign':
                  return (
                    <SignItem
                      item={item} 
                      address={address}
                      balance={eth}
                      navigation={navigation}
                    />
                  )
                case 'link':
                  return (
                    <DeviceItem
                      item={item}
                      address={address}
                      balance={eth}
                      navigation={navigation}
                      handleUnlink={() => originWallet.handleUnlink(item)}/>
                  )
                default:
                  return null
              }
            }
          }}
          renderSectionHeader={({ section: { title }}) => {
            if (!processed_events.length || title === 'Pending') {
              return null
            }

            return (
              <View style={styles.header}>
                <Text style={styles.headerText}>{title.toUpperCase()}</Text>
              </View>
            ) 
          }}
          sections={[
            { title: 'Pending', data: pending_events },
            { title: 'Recent Activity', data: processed_events },
          ]}
          style={styles.list}
          ItemSeparatorComponent={({ section }) => {
            return <Separator padded={section.title !== 'Pending'} />
          }}
        />
        {active_event &&
          active_event.transaction &&
          address &&
          <TransactionModal
            item={active_event}
            address={address}
            balance={eth}
            handleApprove={() => this.acceptItem(active_event)}
            handleReject={() => this.rejectItem(active_event)}
            toggleModal={this.toggleModal}
          />
        }
        {active_event &&
          active_event.sign &&
          address &&
          <SignModal
            item={active_event}
            address={address}
            balance={eth}
            handleApprove={() => this.acceptItem(active_event)}
            handleReject={() => this.rejectItem(active_event)}
            toggleModal={this.toggleModal}
          />
        }
        {active_event &&
          active_event.link &&
          address &&
          <DeviceModal
            item={active_event}
            address={address}
            balance={eth}
            handleApprove={() => this.acceptItem(active_event)}
            handleReject={() => this.rejectItem(active_event)}
            toggleModal={this.toggleModal}
          />
        }
        <NotificationsModal />
      </Fragment>
    )
  }
}

const mapStateToProps = state => {
  return {
    active_event: state.wallet_events.active_event,
    address: state.wallet.address,
    balances: state.wallet.balances,
    pending_events: state.wallet_events.pending_events,
    processed_events: state.wallet_events.processed_events,
  }
}

const mapDispatchToProps = dispatch => ({
  setActiveEvent: event => dispatch(setActiveEvent(event))
})

export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen)

const styles = StyleSheet.create({
  expand: {
    marginLeft: 'auto',
  },
  header: {
    backgroundColor: '#f8fafa',
    borderColor: '#c8c7cc',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    height: 24,
    justifyContent: 'center',
    paddingLeft: 20,
    paddingRight: 20,
  },
  headerText: {
    color: '#94a7b5',
    fontFamily: 'Poppins',
    fontSize: 10,
  },
  icon: {
    marginRight: 10,
  },
  list: {
    backgroundColor: '#f7f8f8',
  },
  svContainer: {
    backgroundColor: '#0b1823',
    height: 66,
  },
  text: {
    fontFamily: 'Lato',
    fontSize: 17,
  },
  walletSVContainer: {
    paddingBottom: 10,
    paddingLeft: 10,
  },
  walletHeader: {
    backgroundColor: '#0b1823',
    flexDirection: 'row',
    padding: 10,
  },
  walletHeading: {
    color: '#c0cbd4',
    fontFamily: 'Lato',
    fontSize: 12,
  },
})
