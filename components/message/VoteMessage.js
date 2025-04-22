import PropTypes from 'prop-types';
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View, Alert} from 'react-native';
import {Button} from 'react-native-elements';
import {MAIN_COLOR} from '../../styles';
import VoteProgress from '../VoteProgress';
import {useDispatch, useSelector} from 'react-redux';
import {setCurrentVote} from '../../redux/chatSlice';

const VoteMessage = ({
  message = {},
  navigation = {},
  onViewVoteDetailModal = null
}) => {

  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  const user = auth?.user;

  // Đảm bảo message.options tồn tại và là mảng trước khi thực hiện sort
const options = Array.isArray(message?.options) 
  ? [...message.options].sort((option1, option2) =>
      (option1.userIds?.length || 0) > (option2.userIds?.length || 0) ? -1 : 1)
  : [];

  const voteUtils = {
    getTotalOfVotes: (options) => {
      if (!options || !Array.isArray(options)) return 0;
      return options.reduce((total, option) => {
        return total + (option.userIds ? option.userIds.length : 0);
      }, 0);
    },
    
    getPercentOfVotes: (total, count) => {
      if (total === 0) return 0;
      return Math.round((count / total) * 100);
    },
    
    getNumOfPeopleVoted: (options) => {
      if (!options || !Array.isArray(options)) return 0;
      
      const allUserIds = [];
      options.forEach(option => {
        if (option.userIds && Array.isArray(option.userIds)) {
          option.userIds.forEach(userId => {
            if (!allUserIds.includes(userId)) {
              allUserIds.push(userId);
            }
          });
        }
      });
      
      return allUserIds.length;
    }
  };

  const totalOfVotes = voteUtils.getTotalOfVotes(options);

  const goToVoteScreen = () => {
    dispatch(setCurrentVote(message));
    navigation.navigate('VoteDetailScreen', { voteData: message });
  };

  const handleVoteOptionChange = async (isChecked, optionName) => {
    Alert.alert(
      'Bình chọn',
      `Đến trang chi tiết để ${isChecked ? 'thêm' : 'bỏ'} bình chọn cho "${optionName}"`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xem chi tiết',
          onPress: goToVoteScreen,
        },
      ],
    );
  };

  return (
    <TouchableOpacity onPress={goToVoteScreen}>
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <Text style={styles.text}>{message.content}</Text>
          {totalOfVotes > 0 && (
            <TouchableOpacity
              onPress={() => onViewVoteDetailModal({isVisible: true, options})}>
              <Text style={{...styles.smallText, color: MAIN_COLOR}}>
                {voteUtils.getNumOfPeopleVoted(options)} Người đã bình chọn
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {options.map((option, index) => {
          const isChecked = user && option.userIds && Array.isArray(option.userIds) && 
                          option.userIds.includes(user._id);
          
          return (
            index < 3 && (
              <VoteProgress
                key={option._id || index}
                totalOfVotes={totalOfVotes}
                option={option}
                voteUtils={voteUtils} 
                isCheckBoxType={true}
                onChange={handleVoteOptionChange}
                checked={isChecked}
              />
            )
          );
        })}

        {options.length > 3 && (
          <View style={{...styles.textContainer, marginTop: 8}}>
            <Text style={{...styles.smallText, color: 'grey'}}>
              {options.length - 3} Phương án khác
            </Text>
          </View>
        )}
        <Button
          title="Đổi lựa chọn"
          type="clear"
          onPress={goToVoteScreen}
          buttonStyle={{backgroundColor: '#f0f8fb', borderRadius: 50}}
          containerStyle={{borderRadius: 50, width: '100%', marginTop: 8}}
        />
      </View>
    </TouchableOpacity>
  );
};

VoteMessage.propTypes = {
  message: PropTypes.object,
  navigation: PropTypes.object,
  onViewVoteDetailModal: PropTypes.func,
};

// Đã chuyển sang sử dụng ES6 default parameters thay vì defaultProps
export default VoteMessage;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    alignSelf: 'center',
    alignItems: 'center',
    width: '80%',
    justifyContent: 'center',
    flexDirection: 'column',
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
  },
  textContainer: {
    width: '100%',
    justifyContent: 'center',
    alignContent: 'flex-start',
  },
  text: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    textAlignVertical: 'center',
  },
  smallText: {fontSize: 12, textAlignVertical: 'center'},
});
