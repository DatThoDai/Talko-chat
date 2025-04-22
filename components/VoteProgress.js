import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import {WINDOW_WIDTH} from '../styles';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

const VoteProgress = props => {
  const {
    totalOfVotes, 
    option, 
    maxWidth, 
    isCheckBoxType, 
    onChange, 
    checked: externalChecked,
    voteUtils
  } = props;
  
  const auth = useSelector(state => state.auth);
  const user = auth?.user;

  // Tính toán phần trăm
  let percent = 0;
  if (voteUtils && totalOfVotes >= 0 && option && option.userIds) {
    const count = Array.isArray(option.userIds) ? option.userIds.length : 0;
    percent = voteUtils.getPercentOfVotes(totalOfVotes, count);
  }
  percent = isNaN(percent) ? 0 : percent;
  
  // Lấy số lượng người bình chọn
  const voteCount = option?.userIds?.length || 0;
  
  // Cập nhật phần xác định trạng thái checked
  const isChecked = typeof externalChecked !== 'undefined' 
    ? externalChecked 
    : false; // Chỉ dùng giá trị từ prop, không tự xác định
    
  // State nội bộ theo dõi trạng thái UI
  const [checked, setChecked] = useState(isChecked);

  // Luôn cập nhật khi prop thay đổi
  useEffect(() => {
    console.log(`Setting checked state for ${option?.name}:`, isChecked);
    setChecked(isChecked);
  }, [isChecked, option?.name]);

  // Cải thiện cách xác định checked status
  useEffect(() => {
    // Luôn ưu tiên giá trị từ props
    if (typeof externalChecked !== 'undefined') {
      console.log(`Setting checked for ${option?.name} from props: ${externalChecked}`);
      setChecked(externalChecked);
    } 
    // Không tự xác định checked nếu đã có prop
  }, [externalChecked]);

  // Chỉ phản hồi sự kiện onClick, không tự thay đổi state
  const handleOnPress = () => {
    if (!user) return;
    
    if (onChange && option?.name) {
      console.log(`Toggling option ${option.name} from`, checked);
      onChange(!checked, option.name);
    }
    // KHÔNG gọi setChecked ở đây, để parent component kiểm soát state
  };

  // Component checkbox
  const renderCheckbox = () => {
    console.log(`Rendering checkbox for ${option?.name}, checked: ${checked}`);
    return (
      <View style={styles.checkboxContainer}>
        {checked ? (
          <View style={styles.checkedBox}>
            <Icon name="check" size={16} color="#ffffff" />
          </View>
        ) : (
          <View style={styles.uncheckedBox} />
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity 
      onPress={isCheckBoxType ? handleOnPress : null} 
      activeOpacity={0.8}
      disabled={!isCheckBoxType}
    >
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${percent}%` }
          ]}>
        </View>
        
        <View style={styles.progressContent}>
          {isCheckBoxType && renderCheckbox()}
          <Text style={styles.optionText} numberOfLines={1} ellipsizeMode="tail">
            {option?.name || ''}
          </Text>
        </View>
        
        {/* Hiển thị số lượng bình chọn và phần trăm */}
        <View style={styles.voteCountContainer}>
          <Text style={styles.voteCountText}>{voteCount}</Text>
          <Text style={styles.percentText}>{percent}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

VoteProgress.propTypes = {
  totalOfVotes: PropTypes.number,
  option: PropTypes.object,
  maxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isCheckBoxType: PropTypes.bool,
  onChange: PropTypes.func,
};

VoteProgress.defaultProps = {
  totalOfVotes: 0,
  option: { name: '', userIds: [] },
  maxWidth: WINDOW_WIDTH * 0.8 - 20,
  isCheckBoxType: false,
  onChange: null,
  voteUtils: {
    getPercentOfVotes: (total, count) => {
      if (!total || total === 0) return 0;
      return Math.round((count / total) * 100);
    }
  }
};

export default VoteProgress;

const styles = StyleSheet.create({
  progressBar: {
    width: '100%',
    backgroundColor: '#ecf0f3',
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
    position: 'relative',
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressFill: {
    backgroundColor: '#bfe0ff',
    borderRadius: 8,
    minWidth: 40,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
    position: 'relative',
    zIndex: 2,
    width: '75%',
  },
  optionText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  checkboxContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#a1aaaf',
    backgroundColor: '#fff',
  },
  checkedBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#1194ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voteCountContainer: {
    position: 'absolute',
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  voteCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginRight: 6,
  },
  percentText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
