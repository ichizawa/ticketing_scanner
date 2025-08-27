import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, SafeAreaView, ImageBackground } from 'react-native'
import React, { useState, useMemo, useEffect, useContext } from 'react'
import { AuthContext } from './context/AuthContext'
import { BASE_URL, processResponse } from './config';
// // Sample ticket sales data
// const sampleTicketSales = [
//     {
//         id: '1',
//         ticketNumber: 'TK-001',
//         customerName: 'John Doe',
//         event: 'Concert Night 2024',
//         price: 150.00,
//         quantity: 2,
//         total: 300.00,
//         date: '2024-01-15',
//         status: 'Paid'
//     },
//     // {
//     //     id: '2',
//     //     ticketNumber: 'TK-002',
//     //     customerName: 'Jane Smith',
//     //     event: 'Comedy Show',
//     //     price: 75.00,
//     //     quantity: 1,
//     //     total: 75.00,
//     //     date: '2024-01-16',
//     //     status: 'Paid'
//     // },
//     // {
//     //     id: '3',
//     //     ticketNumber: 'TK-003',
//     //     customerName: 'Mike Johnson',
//     //     event: 'Sports Event',
//     //     price: 200.00,
//     //     quantity: 4,
//     //     total: 800.00,
//     //     date: '2024-01-17',
//     //     status: 'Pending'
//     // },
//     // {
//     //     id: '4',
//     //     ticketNumber: 'TK-004',
//     //     customerName: 'Sarah Wilson',
//     //     event: 'Theater Play',
//     //     price: 120.00,
//     //     quantity: 2,
//     //     total: 240.00,
//     //     date: '2024-01-18',
//     //     status: 'Paid'
//     // },
//     // {
//     //     id: '5',
//     //     ticketNumber: 'TK-005',
//     //     customerName: 'David Brown',
//     //     event: 'Music Festival',
//     //     price: 300.00,
//     //     quantity: 1,
//     //     total: 300.00,
//     //     date: '2024-01-19',
//     //     status: 'Refunded'
//     // },
//     // {
//     //     id: '6',
//     //     ticketNumber: 'TK-006',
//     //     customerName: 'Lisa Davis',
//     //     event: 'Art Exhibition',
//     //     price: 50.00,
//     //     quantity: 3,
//     //     total: 150.00,
//     //     date: '2024-01-20',
//     //     status: 'Paid'
//     // }
// ];

// const sampleTicketSales = [];

export default function Sales({ navigation }) {
    const { userDetails } = useContext(AuthContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [ticks, setTicks] = useState([]);

    const STATUS_MAP = {
        S: 'Paid',
        P: 'Pending',
        D: 'Disabled',
    };

    // Filter tickets based on search query and status
    const filteredTickets = useMemo(() => {
        return ticks.filter(ticket => {
            const search = searchQuery.toLowerCase();

            const matchesSearch =
                ticket.reference_num?.toLowerCase().includes(search) ||
                ticket.sale?.customer_name?.toLowerCase().includes(search) ||
                ticket.event?.toLowerCase().includes(search);

            const matchesStatus =
                selectedStatus === 'All' || ticket.sale?.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });
    }, [searchQuery, selectedStatus, ticks]);

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'long',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'S': return '#4CAF50'; // Paid
            case 'P': return '#FF9800'; // Pending
            case 'D': return '#F44336'; // Disabled
            default: return '#757575';
        }
    };

    const renderTicketItem = ({ item }) => (
        <View style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
                <Text style={styles.ticketNumber}>{item.reference_num}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.sale?.status) }]}>
                    <Text style={styles.statusText}>{STATUS_MAP[item.sale?.status] || 'Unknown'}</Text>
                </View>
            </View>

            <Text style={styles.customerName}>{item.sale?.customer_name}</Text>
            <Text style={styles.eventName}>{item.sale?.refno}</Text>

            <View style={styles.ticketDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Price:</Text>
                    <Text style={styles.detailValue}>₱{parseFloat(item.sale?.ticket?.ticket_price).toFixed(2)}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Qty:</Text>
                    <Text style={styles.detailValue}>{item.sale?.customer_quantity}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total:</Text>
                    <Text style={styles.totalValue}>₱{parseFloat(item.sale?.ticket?.ticket_price * item.sale?.customer_quantity).toFixed(2)}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>{formatDateTime(item.sale?.created_at)}</Text>
                </View>
            </View>
        </View>
    );

    const StatusFilter = ({ status, isSelected, onPress }) => (
        <TouchableOpacity
            style={[styles.filterButton, isSelected && styles.filterButtonActive]}
            onPress={onPress}
        >
            <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                {status}
            </Text>
        </TouchableOpacity>
    );

    const salesLists = () => {
        try {
            fetch(`${BASE_URL}tickets`, {
                method: "GET",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${userDetails.token}`
                }
            })
                .then(processResponse)
                .then((res) => {
                    const { statusCode, data } = res;
                    // console.log(data.data);
                    setTicks(data.data);
                });
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        salesLists();
    }, []);

    return (
        <ImageBackground
            source={require('../assets/bg.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Navigation Bar */}
                <View style={styles.navbar}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => { navigation.navigate('Main'); }}
                    >
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.navTitle}>Ticket Sales</Text>
                    <View style={styles.navPlaceholder} />
                </View>

                <View style={styles.content}>
                    {/* Search Input */}
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by ticket number, customer name, or event..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#999"
                    />

                    {/* Status Filters */}
                    <View style={styles.filtersContainer}>
                        <Text style={styles.filterLabel}>Filter by status:</Text>
                        <View style={styles.filtersRow}>
                            {['All', 'S', 'P', 'D'].map(status => (
                                <StatusFilter
                                    key={status}
                                    status={status === 'All' ? 'All' : STATUS_MAP[status]}
                                    isSelected={selectedStatus === status}
                                    onPress={() => setSelectedStatus(status)}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Results Summary */}
                    <Text style={styles.resultsCount}>
                        {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} found
                    </Text>

                    {/* Tickets List */}
                    <FlatList
                        data={filteredTickets}
                        renderItem={renderTicketItem}
                        keyExtractor={item => item.id?.toString() || item.reference_num}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No tickets found</Text>
                                <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
                            </View>
                        }
                    />
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 20,
        color: '#333',
        fontWeight: 'bold',
    },
    navTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    navPlaceholder: {
        width: 40, // Same width as back button to center the title
    },
    content: {
        flex: 1,
        padding: 16,
    },
    searchInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    filtersContainer: {
        marginBottom: 16,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    filtersRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    filterButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    filterText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#fff',
    },
    resultsCount: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    listContainer: {
        paddingBottom: 20,
    },
    ticketCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    ticketNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
        marginBottom: 4,
    },
    eventName: {
        fontSize: 14,
        color: '#777',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    ticketDetails: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    totalValue: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});